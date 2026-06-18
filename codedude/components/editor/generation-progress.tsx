


"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Loader2, FileCode, Check, Sparkles, BrainCircuit } from "lucide-react";

export interface GenerationProgressProps {
    content: string;
    isStreaming: boolean;
    changedFiles: string[];
}

interface FileProgress {
    path: string;
    status: "writing" | "done";
}

const FILE_OPEN_REGEX = /<file\s+path="([^"]+)">/g;

const FILE_COMPLETE_REGEX = /<file\s+path="([^"]+)">[\s\S]*?<\/file>/g;

function parseFileProgress(content: string): FileProgress[] {
    const openedFiles: string[] = [];
    FILE_OPEN_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FILE_OPEN_REGEX.exec(content)) !== null) {
        openedFiles.push(match[1].trim());
    }

    const completedFiles = new Set<string>();
    FILE_COMPLETE_REGEX.lastIndex = 0;
    while ((match = FILE_COMPLETE_REGEX.exec(content)) !== null) {
        completedFiles.add(match[1].trim());
    }
    return openedFiles.map(path => ({
        path,
        status: completedFiles.has(path) ? "done" as const : "writing" as const,
    }));

}

function getFileName(path: string): string {
    return path.split("/").pop() || path;
}

export function GenerationProgress({ content, isStreaming, changedFiles }: GenerationProgressProps) {
    const files = useMemo(() => {
        const parsed = parseFileProgress(content);
        if (parsed.length === 0 && changedFiles && changedFiles.length > 0) {
            return changedFiles.map(path => ({
                path,
                status: "done" as const,
            }));
        }
        return parsed;
    }, [content, changedFiles]);

    const hasFiles = files.length > 0;

    const hasActiveFiles = files.some(file => file.status === "writing");

    if (isStreaming && !hasFiles) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="relative flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <BrainCircuit className="size-4 text-primary animate-pulse" />

                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">
                            Thinking
                            <span className="inline-flex w-6">
                                <span className="animate-[dotPulse_1.5s_infinite]">.</span>
                                <span className="animate-[dotPulse_1.5s_infinite]">.</span>
                                <span className="animate-[dotPulse_1.5s_infinite]">.</span>
                            </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Analyzing your project and generating code...
                        </span>
                    </div>


                </div>

            </div>
        );
    }
    if (!hasFiles) {
        return null;
    }
    const doneCount = files.filter(file => file.status === "done").length;
    return (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/30 px-3.5 py-2">
                {
                    isStreaming ? (
                        <>
                            <Sparkles className="size-3.5 text-primary animate-pulse" />
                            <span className="text-sm font-medium text-foreground">
                                Generating {files.length}{files.length === 1 ? " file" : " files"} ...
                            </span>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                                {doneCount}/{files.length}
                            </span>
                        </>
                    ) : (
                        <>
                            <FileCode className="size-3.5 text-emerald-500" />
                            <span className="text-xs font-medium text-foreground">
                                {files.length} {files.length === 1 ? "file" : "files"} generated
                            </span>
                        </>
                    )
                }
            </div>
            <div className="divide-y divide-border/10">
                {
                    files.map((file) => (
                        <div
                            key={file.path}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-2",
                                file.status === "done" && "bg-emerald-100 text-emerald-800"
                            )}
                        >
                            {file.status === "done" ? (
                                <Check className="size-3.5" />
                            ) : (
                                <Loader2 className="size-3.5 animate-spin" />
                            )}
                            <span className="text-sm">{file.path}</span>
                        </div>

                    ))
                }
            </div>

        </div>
    )

}


