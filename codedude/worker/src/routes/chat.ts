
import { Hono } from "hono";
import { Env, AppVariables } from "../types";
import { getModel, MODEL_REGISTRY } from "../ai/providers";
import { Project, ProjectFile, Version } from "../types/project";
import { ChatSession, ImageAttachment } from "../types/chat";
import { sanitizeChatMessage } from "../services/sanitize";
import { checkCredits, deductCredits } from "../services/credits";
import { buildSystemPrompt, prepareChatHistory } from "../ai/system-prompt";
import { streamSSE } from "hono/streaming";
import { ModelMessage, streamText } from "ai";
import { extractExplanation, mergeFiles, parseFilesFromResponse } from "../ai/file-parse";
import { ChatMessage } from "../types/chat";
const chatRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();








chatRoutes.post("/:projectId", async (c) => {
    const projectId = c.req.param("projectId");
    const userId = c.var.userId;
    const project = await c.env.METADATA.get<Project>(`project:${projectId}`, "json");
    if (!project) {
        return c.json({ error: "Project not found", code: "PROJECT_NOT_FOUND" }, 404);
    }
    if (project.userId !== userId) {
        return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
    }
    const chatHistory = await c.env.METADATA.get<ChatSession>(`chat:${projectId}`, "json");
    return c.json({ messages: chatHistory?.messages || [] });

});


chatRoutes.post("/:projectId", async (c) => {
    const userId = c.var.userId;
    const projectId = c.req.param("projectId");
    const body = await c.req.json<{
        message: string;
        model?: string;
        image?: ImageAttachment[];
    }>();
    const sanitizedMessage = sanitizeChatMessage(body.message);
    if (!sanitizedMessage) {
        return c.json({ error: "Message is empty or invalid", code: "INVALID_MESSAGE" }, 400);
    }
    const modelId = body.model || "gpt-4o-mini";
    const images = body.image || [];
    if (images.length > 5) {
        return c.json({ error: "Too many images. Maximum is 5.", code: "TOO_MANY_IMAGES" }, 400);
    }
    for (const image of images) {
        const sizeInBytes = (image.base64.length * 3) / 4;
        if (sizeInBytes > 4 * 1024 * 1024) {
            return c.json({ error: "Image size exceeds 4MB limit.", code: "IMAGE_TOO_LARGE" }, 400);
        }
    }
    const modelConfig = MODEL_REGISTRY[modelId];
    if (!modelConfig) {
        return c.json({ error: "Model not found", code: "MODEL_NOT_FOUND" }, 404);
    }
    const project = await c.env.METADATA.get<Project>(`project:${projectId}`, "json");
    if (!project) {
        return c.json({ error: "Project not found", code: "PROJECT_NOT_FOUND" }, 404);
    }

    if (project.userId !== userId) {
        return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
    }
    const creditCheck = await checkCredits(userId, modelConfig.creditCost, c.env);
    if (modelConfig.tier === "premium" && creditCheck.credits.plan === "free") {
        return c.json({
            error: "This model is only available for pro users.", code: "PRO_MODEL_ONLY",
            plan: creditCheck.credits.plan,
        }, 403);
    }

    if (!creditCheck.allowed) {
        return c.json({
            error: "Insufficient credits", code: "INSUFFICIENT_CREDITS",
            required: modelConfig.creditCost,
            remaining: creditCheck.credits.remaining,
        }, 403);
    }
    const versionKey = `${projectId}:v${project.currentVersion}/files.json`;
    const versionObject = await c.env.METADATA.get(versionKey, "json");
    let existingFiles: ProjectFile[] = [];
    if (versionObject) {
        const versionData = await versionObject as Version;
        existingFiles = versionData.files || [];

    }
    const chatSession = await c.env.METADATA.get<ChatSession>(`chat:${projectId}`, "json");
    const chatHistory = chatSession?.messages || [];
    const systemPrompt = buildSystemPrompt(existingFiles);
    const rawMessages: Array<{ role: "user" | "assistant"; content: string; }> = [];
    for (const msg of chatHistory) {
        if (msg.role === "system") continue;
        rawMessages.push({
            role: msg.role,
            content: msg.content,
        });
    }
    const trimmedHistory = prepareChatHistory(rawMessages);
    const sdkMessage: ModelMessage[] = trimmedHistory.map((msg) =>
        msg.role === "user"
            ? { role: "user" as const, content: msg.content }
            : { role: "assistant" as const, content: msg.content },
    );
    if (images.length > 0 && modelConfig.supportsVision) {
        sdkMessage.push({
            role: "user" as const,
            content: [
                { type: "text" as const, text: sanitizedMessage },
                ...images.map(img => ({
                    type: "image" as const,
                    image: img.base64,
                    mimetype: img.mediaType,
                })),
            ],
        });
    } else {
        sdkMessage.push({
            role: "user" as const,
            content: sanitizedMessage,
        });
    }
    return streamSSE(c, async (stream) => {
        let fullResponse = "";
        let eventId = 0;
        try {
            const model = getModel(modelId, c.env);
            const result = streamText({
                model,
                system: systemPrompt,
                messages: sdkMessage,
                maxOutputTokens: modelConfig.maxOutputTokens,
            });
            for await (const chunk of result.textStream) {
                fullResponse += chunk;
                await stream.writeSSE({
                    event: "chunk",
                    data: JSON.stringify({ text: chunk }),
                    id:String(eventId++),
                });
            }
            const parsedFiles= parseFilesFromResponse(fullResponse);
            const changedFilePaths= parsedFiles.map((f)=>f.path);
            console.log("Parsed files from response:", parsedFiles.length);
            const mergedFiles = parsedFiles.length>0
            ?mergeFiles(existingFiles, parsedFiles)
            :existingFiles;
            let newVersionNumber = project.currentVersion;
            if (parsedFiles.length > 0) {
                newVersionNumber = project.currentVersion + 1;
                console.log(`Creating new version: ${newVersionNumber} with ${parsedFiles.length} changed files.`);
                const newVersion: Version = {
                    versionNumber: newVersionNumber,
                    prompt: systemPrompt,
                    model: modelId,
                    files: mergedFiles,
                    changedFiles: changedFilePaths,
                    type: "ai",
                    createdAt: new Date().toISOString(),
                    fileCount: mergedFiles.length,
                };
                try{
                    await c.env.METADATA.put(
                        `${projectId}:v${newVersionNumber}/files.json`,
                        JSON.stringify(newVersion),
                    );
                    console.log(`
                        [chat] Stored new version ${newVersionNumber} with ${mergedFiles.length} total files (${parsedFiles.length} changed).`)


                }catch(error){
                    console.error("Error storing new version:", error);
                    throw new Error("Failed to store new version");
                    

                }
                project.currentVersion = newVersionNumber;
                project.updatedAt = new Date().toISOString();
                try{
                    await c.env.METADATA.put(`project:${projectId}`, JSON.stringify(project));
                    console.log(`[chat] Updated project ${projectId} to version ${newVersionNumber}.`);
                }
                catch(error){
                    console.error("Error updating project metadata:", error);
                    throw new Error("Failed to update project metadata");
                }
            }
            const updatedCredits = await deductCredits(userId, modelConfig.creditCost, c.env);
            const explanation = extractExplanation(fullResponse);
            const newUserMessage: ChatMessage = {
                role: "user",
                id: `msg-${Date.now()}-user`,
                content: sanitizedMessage,
                timestamp: new Date().toISOString(),
                images: images.length > 0 ? images : undefined,

            };
            const newAssistantMessgae: ChatMessage = {
                role: "assistant",
                id: `msg-${Date.now()}-assistant`,
                content: explanation ,
                timestamp: new Date().toISOString(),
                model: modelId,
                changedFiles: parsedFiles.length > 0 ? changedFilePaths : undefined,
                versionNumber:parsedFiles.length > 0 ? newVersionNumber : undefined,
            };
            const updatedChatSession: ChatSession = {
                projectId,
                messages: [...chatHistory, newUserMessage, newAssistantMessgae],
                createdAt: chatSession?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            try{
                await c.env.METADATA.put(`chat:${projectId}`, JSON.stringify(updatedChatSession));
                console.log(`[chat] Updated chat session for project ${projectId}. Total messages: ${updatedChatSession.messages.length}`);

            }catch(error){
                console.error("Error updating chat session:", error);
            }
            if(parsedFiles.length>0){
            await stream.writeSSE({
                event: "files",
                data: JSON.stringify({ files: mergedFiles }),
                id:String(eventId++),
            });
            }
            await stream.writeSSE({
                event: "done",
                data: JSON.stringify({
                    model: modelId,
                    versionId:`v${newVersionNumber}`,
                    changedFiles:  changedFilePaths ,
                    creditsRemaining: updatedCredits.remaining,
                }),
                id:String(eventId++),
            });

        }catch (error) {
            console.error("Error during chat processing:", error);
        }
        

    })

});



export { chatRoutes };