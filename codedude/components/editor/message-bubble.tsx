"use client";

import { getModelById } from "@/lib/model";
import { cn } from "@/lib/utils";
import { ChatMessage, ImageAttachment } from "@/types/chat";
import { Bot, Check, Loader2, RotateCcw, User, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GenerationProgress } from "./generation-progress";



export interface MessageBubbleProps {
    message: ChatMessage;
    isStreaming?: boolean;
    isAutoHealInProgress?: boolean;
}

const FILE_TAG_REGEX = /<file\s+path="[^"]+">\n?[\s\S]*?\n?<\/file>/g;

const PARTIAL_FILE_REGEX = /<file\s+path="[^"]+">[\s\S]*$/;

function stripFileTags(content: string, isStreaming: boolean): string {
    let cleaned = content.replace(FILE_TAG_REGEX, "").replace(/\n{3,}/g, "\n\n");
    cleaned = cleaned.replace(PARTIAL_FILE_REGEX, "");
    cleaned = cleaned.replace(/<\/file>/g, "");
    return cleaned.trim();
}

function hasFileTags(content: string): boolean {
    return /<file\s+path="/.test(content);
}


function formatModelName(modelId: string): string {
    const modelInfo = getModelById(modelId);
    if (modelInfo) {
        return modelInfo.name;
    }
    if (modelId.includes("gpt-4o")) {
        return "GPT-4o";
    }
    if (modelId.includes("gemini")) {
        return "Gemini";
    }
    if (modelId.includes("claude")) {
        return "Claude";
    }
    if (modelId.includes("gpt-4o-mini")) {
        return "GPT-4o Mini";
    }
    if (modelId.includes("deepseek")) {
        return "DeepSeek";
    }
    return modelId;
}


const AUTO_HEAL_PREFIX = "the app has a build /runtime error"

function extractAttemptNumber(content: string): number {
    const match = content.match(/\(attempt (\d+)\/\d+\)/);
    return (match) ? parseInt(match[1], 10) : 1;

}


function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}


export function MessageBubble({
    message,
    isStreaming,
    isAutoHealInProgress
}: MessageBubbleProps) {
    const [selectedText, setSelectedText] = useState<ImageAttachment | null>(null);
    const isUser = message.role === "user";

    const displayContent = useMemo(() => {
        if (isUser) return message.content;
        return stripFileTags(message.content, !isStreaming);
    }, [message.content, isStreaming, isUser]);

    const showProgress = !isUser && (
        hasFileTags(message.content) || (message.changedFiles && message.changedFiles.length > 0)
    );

    const isThinking = isStreaming && !isUser && message.content.length === 0;
    const isAutoHeal = isUser && message.content.startsWith(AUTO_HEAL_PREFIX);
    if (isAutoHeal) {
        const attempt = extractAttemptNumber(message.content);
        const healDone = !isAutoHealInProgress;
        return (
            <div className="group flex gap-3 animate-fade-in">
                <div
                    className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg border",
                        healDone
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-amber-500/30 bg-amber-500/10"
                    )}>
                    {
                        healDone ? (
                            <Check className="size-3.5 text-green-500" />
                        ) : (
                            <Wrench className="size-3.5 text-amber-500" />
                        )
                    }
                </div>
                <div className="flex max-w-[85%] flex-col gap-1">
                    <div
                        className={cn(
                            "flex items-center gap-2 rounded-2xl rounded-tl-md border px-4 py-2.5 text-sm",
                            healDone
                                ? "border-green-500/30 bg-green-500/10 text-green-500"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                        )}
                    >
                        {
                            healDone ? (
                                <Check className="size-3.5 shrink-0" />
                            ) : (
                                <Loader2 className="size-3.5 animate-spin shrink-0" />
                            )
                        }
                        <span className="font-medium">
                            {
                                healDone ?
                                    `Auto-fix applied (attempt ${attempt}/3)`
                                    : "Auto-fixing error (attempt ${attempt}/3)"
                            }
                        </span>
                    </div>
                    <span
                        className="px-1 text-[10px] text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        {formatTime(message.timestamp)}
                    </span>
                </div>
            </div>
        );
    }
    if (message.role === "system") {
        return (
            <div
                className="group flex w-full flex-col items-center gap-1 animate-fade-in py-1"
            >
                <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs text-muted-foreground">
                    <RotateCcw className="size-3 shrink-0" />
                    <span className="font-medium">{message.content}</span>
                </div>
                <span
                    className="text-2xl text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100"
                >
                    {formatTime(message.timestamp)}

                </span>
            </div>
        );

    }
    return (
        <div
            className={cn(
                "group flex gap-3 animate-fade-in",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <div
                className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    isUser ? "bg-primary text-primary-foreground" : "border border-border/50 bg-secondary",
                )}
            >
                {
                    isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />
                }
            </div>
            <div
                className={cn(
                    "flex max-w-[85%] flex-col gap-1",
                    isUser ? "items-end" : "items-start"
                )}>
                {
                    !isUser && message.model && (
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal"
                        >
                            {formatModelName(message.model)}
                        </Badge>
                    )
                }

                {
                    isUser && message.images && message.images?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-end">
                            {
                                message.images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedText(image)}
                                        type="button"
                                        className="size-16 cursor-pointer overflow-hidden rounded-lg border border-border/50 transition-transform duration-150"

                                    >
                                        <img
                                            src={`data:${image.mediaType};base64,${image.base64}`}
                                            alt={image.name || `Attached image ${index + 1}`}
                                            className="size-full object-cover"
                                        />
                                    </button>
                                ))
                            }
                        </div>
                    )
                }

            </div>
            <Dialog
                open={!!selectedText}
                onOpenChange={(open) => !open && setSelectedText(null)}
            >
                <DialogContent
                    className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none sm:max-w-[90vw] overflow-hidden"
                    showCloseButton
                >
                    <DialogTitle className="sr-only">
                        {selectedText?.name || "Attached Image"}

                    </DialogTitle>
                    {
                        selectedText && (
                            <div
                                className="flex flex-col items-center gap-2"
                            >
                                <img
                                    src={`data:${selectedText.mediaType};base64,${selectedText.base64}`}
                                    alt={selectedText.name || "Attached image"}
                                    className="max-w-[85vh] max-h-full rounded-lg object-contain"
                                />
                                {
                                    selectedText.name && (
                                        <span className="text-xs text-muted-foreground">
                                            {selectedText.name}
                                        </span>
                                    )
                                }
                            </div>
                        )
                    }
                </DialogContent>
            </Dialog>
            {isUser ? (
                <div
                    className="rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm"
                >
                    <p
                        className="whitespace-pre-wrap break-words"
                    >{displayContent}</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {
                        displayContent && (
                            <div className="rounded-2xl rounded-tl-md border-border/50 bg-card px-4 py-3 text-sm leading-relaxed shadow-sm">
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/50"
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                    >
                                        {displayContent}
                                    </ReactMarkdown>
                                    {
                                        isStreaming && !showProgress && (
                                            <span
                                                className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle"
                                            />
                                        )
                                    }
                                </div>
                            </div>
                        )
                    }

                    {(showProgress || isThinking) && (
                        <GenerationProgress
                            content={message.content}
                            isStreaming={!!isStreaming}
                            changedFiles={message.changedFiles}
                        />
                    )}
                </div>
            )}
            <span className="px-1 text-[10px] text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
                {formatTime(message.timestamp)}

            </span>
        </div>
    )



}
