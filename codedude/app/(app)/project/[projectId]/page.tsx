"use client";
import { EditorLayout } from '@/components/editor'
import { useAuth } from '@clerk/nextjs'
import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Project } from '@/types/project'
import { ChatMessage } from '@/types/chat';
import { VersionMeta } from '@/types/project';
import { DEFAULT_MODEL_ID } from '@/lib/model';
import { Skeleton } from '@/components/ui/skeleton';
import { createApiClient, WORKER_URL } from '@/lib/api-client';
import { ProjectFile } from '@/types/project';
import { useCallback } from 'react';
import { ImageAttachment } from '@/types/chat';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { PreviewSkeleton } from '@/components/editor/preview-skeleton';


/**
 * @param content - Raw file content that may have markdown fences
 * @returns The content without markdown fences
 */

const PreviewPanel = dynamic(
  ()=>
    import('@/components/editor/preview-panel').then((mod) => mod.PreviewPanel),
  {
    ssr: false,
    loading: () => <PreviewSkeleton/>,
  },
);


function stripMarkdownFences(content: string): string {
  const lines = content.split('\n');
  if (lines.length > 0 && /^\s*```[a-zA-Z]*\s*$/.test(lines[0])) {
    lines.shift(); // Remove the first line
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop(); // Remove the last line
  }
  if (lines.length > 0 && /^\s*```\s*$/.test(lines[lines.length - 1])) {
    lines.pop(); // Remove the last line if it's a closing fence
  }
  return lines.join('\n');
}


/**
 * 
 * @param files-Array of ProjectFile objects from the API
 * @returns Object mapping file paths to their content
 */

function filesToRecord(files: ProjectFile[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const file of files) {
    const cleaned = stripMarkdownFences(file.content);
    if (cleaned !== file.content) {
      console.warn(`Stripped markdown fences from file ${file.path}`);
    }
    record[file.path] = cleaned;
  }
  return record;
}

/**
 * 
 * @param record-Object mapping file paths to content
 * @returns Array of ProjectFile objects
 */

function recordToFiles(record: Record<string, string>): ProjectFile[] {
  return Object.entries(record).map(([path, content]) => ({ path, content }));
}



const EditorPage = ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { projectId } = use(params);
  const { getToken } = useAuth();
  const router = useRouter();
  const autoHealAttemptRef = useRef(0);
  const justGenerationRef = useRef(false);
  const isStreamingRef = useRef(false);
  const MAX_AUTO_HEAL_ATTEMPTS = 3;
  const pendingPromptRef = useRef<string | null>(null);
  const handleSendMessageRef = useRef<(content: string) => void>(() => { });
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<string>("src/App.tsx");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [version, setVersion] = useState<VersionMeta[]>([]);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [creditRemaining, setCreditRemaining] = useState<number>(0);
  const [creditsTotal, setCreditsTotal] = useState<number>(50);
  const [userPlan, setUserPlan] = useState<"free" | "pro">("free");
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL_ID);
  const isCreditExhausted = creditRemaining !== undefined && creditRemaining !== -1 && creditRemaining <= 0;
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const currentFilesRef = useRef<Record<string, string>>({});
  // diffrence between current files and last saved files, used for autosave and versioning
  const [diffState, setDiffState] = useState<{
    from: number
    to: number
    changes: Array<{
      path: string;
      type: "added" | "modified" | "removed";
      oldContent: string | null;
      newContent: string | null;
    }>
  } | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedFileRef = useRef<Record<string, string>>({});
  const isManualEditRef = useRef(false);
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const client = createApiClient(getToken);
        const [
          projectResponse,
          filesResponse,
          chatResponse,
          versionResponse,
          creditsResponse,
        ] = await Promise.all([
          client.projects.get(projectId),
          client.projects.getFiles(projectId),
          client.chats.getHistory(projectId),
          client.versions.list(projectId),
          client.credits.get()
        ]);
        setProject(projectResponse.project);
        setSelectedModelId(projectResponse.project.model || DEFAULT_MODEL_ID);
        setCreditRemaining(creditsResponse.isUnlimited ? -1 : creditsResponse.remaining);
        setCreditsTotal(creditsResponse.total);
        setUserPlan(creditsResponse.plan);
        const filesRecord = filesToRecord(filesResponse.files);
        setFiles(filesRecord);
        currentFilesRef.current = filesRecord;
        setMessages(chatResponse.messages);
        setVersion(versionResponse.versions);
        const filePaths = filesResponse.files.map(f => f.path);
        if (filePaths.includes("src/App.tsx")) {
          setActiveFile("src/App.tsx");
        } else if (filePaths.length > 0) {
          setActiveFile(filePaths[0]);
        }


        try {
          const storageKey = `pendingPrompt:${projectId}`;
          const pendingPrompt = sessionStorage.getItem(storageKey);
          if (pendingPrompt) {
            pendingPromptRef.current = pendingPrompt;
            sessionStorage.removeItem(storageKey);
          }
        } catch (e) {
        }
      } catch (e) {
        console.error("Failed to fetch project data:", e);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
        setIsLoadingVersion(false);
      }
    }
    fetchProject();
  }, [projectId, getToken, router]);

  const refreshVersion = useCallback(async () => {
    try {
      const client = createApiClient(getToken);
      const response = await client.versions.list(projectId);
      setVersion(response.versions);
    } catch (e) {
      console.error("Failed to refresh version data:", e);
    }
  }, [projectId, getToken]);

  const handleBackToCurrent = () => { alert("Pending Back to Current Implementation") };

  const projectName = project?.name || "Untitled Project";

  const handleSendMessage = useCallback(
    async (
      content: string,
      images?: ImageAttachment[],
      isAutoHeal?: boolean
    ) => {

      if (!isAutoHeal) {
        autoHealAttemptRef.current = 0;
      }

      if (viewingVersion !== null) {
        handleBackToCurrent();
      }

      justGenerationRef.current = false;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        images: images && images.length > 0 ? images : undefined,
      };

      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);
      isStreamingRef.current = true;

      const aiMessageId = `msg-${Date.now()}-assistant`;
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        model: selectedModelId,
      };

      setMessages(prev => [...prev, aiMessage]);

      try {

        const token = await getToken();

        if (!token) {
          throw new Error("Failed to get auth token");
        }

        const response = await fetch(`${WORKER_URL}/api/chat/${projectId}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            model: selectedModelId,
            images: images && images.length > 0 ? images : undefined,
          }),
        });


        if (!response.ok) {
          const errorText = await response.json().catch(() => ({
            error: "Unknown error",
          }));
          const typed = errorText as {
            error?: string;
            code?: string;
            retryAfter?: number;
          };
        }

        if (!response.body) {
          throw new Error("No response body");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {

            if (line.startsWith("event: ")) {
              continue;
            }
            if (line.startsWith("data: ")) {
              continue;
            }
            const data = line.slice(6);
            if (!data) continue;
            try {
              const event = JSON.parse(data);
              if (event.text !== undefined) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId ? { ...msg, content: msg.content + event.text } : msg,
                  )
                );
              }
              if (event.files) {
                const newFiles = filesToRecord(event.files);
                setFiles(newFiles);
                currentFilesRef.current = newFiles;
                lastSavedFileRef.current = newFiles;
                justGenerationRef.current = true;
              }
              if (event.creditsRemaining !== undefined) {
                setCreditRemaining(event.creditsRemaining);
              }
              if (event.versionId) {
                setProject((prev) => prev ? {
                  ...prev,
                  currentVersionId: event.currentVersionId + 1,
                  updatedAt: new Date().toISOString(),
                }
                  : prev,
                );
                const versionNumber = parseInt(
                  event.versionId.replace("v", ""), 10,
                );
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId ? { ...msg, versionNumber } : msg,
                  ),
                );
                refreshVersion();
              }
              if (event.code && event.message) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId ? {
                      ...msg,
                      content: `Error: ${event.message}`,
                    }
                      : msg,
                  ),
                );
                toast.error(event.message as string);

              }
            } catch {

            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const lowerError = errorMessage.toLowerCase();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: `Error: ${errorMessage}` }
              : msg,
          ),
        );
        toast.error(errorMessage);
      } finally {
        setIsStreaming(false);
        isStreamingRef.current = false;
      }
    }, [projectId,
    selectedModelId,
    getToken,
    projectId, handleBackToCurrent, refreshVersion, viewingVersion],);

  const handleFilesChange = (files: Record<string, string>) => { alert("Pending Files Change Implementation") };
  const handleModelChange = (modelId: string) => { alert("Pending Model Change Implementation") };
  const handleRename = (id: string) => { alert("Pending Rename Implementation") };
  const handleDelete = () => { alert("Pending Delete Implementation") };
  if (isLoading) {
    return <EditorLayoutSkeleton />
  }
  return (
    <EditorLayout
      projectId={projectId}
      projectName={projectName}
      files={files}
      messages={messages}
      isStreaming={isStreaming}
      activeFile={activeFile}
      creditsRemaining={creditRemaining}
      creditsTotal={creditsTotal}
      selectedModelId={selectedModelId}
      isCreditExhausted={isCreditExhausted}
      userPlan={userPlan}
      viewingVersion={viewingVersion}
      previewPanel={<PreviewPanel files={files} onError={()=>{alert("Error occurred")}} />}
      codeEditorPanel={<div>Code Editor Panel</div>}
      historyPanel={<div>History Panel</div>}
      onSendMessage={handleSendMessage}
      onFilesChnage={handleFilesChange}
      onActiveFileChange={setActiveFile}
      onModelChange={handleModelChange}
      onRename={handleRename}
      onDelete={handleDelete}
      onBackToCurrent={handleBackToCurrent}
    />
  )
}
export function EditorLayoutSkeleton() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44 hidden sm:block" />
          </div>
        </div>
        <div className="mx-auto">
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className="h-8 w-16 rounded-md hidden sm:block" />
          <Skeleton className="size-7 rounded-full" />
        </div>
      </div>

      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="flex w-[30%] shrink-0 flex-col border-r border-border">
          <div className="flex-1 space-y-4 p-4">
            <Skeleton className="ml-auto h-16 w-3/4 rounded-2xl" />
            <Skeleton className="h-24 w-3/4 rounded-2xl" />
            <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex-1 p-4">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>
        <div className="flex md:hidden flex-1 flex-col p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>

      </div>

    </div>
  )
}

export default EditorPage
