"use client"
import dynamic from "next/dynamic";
import { Project } from "@/types/project";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";


/*This loads ProjectPreview only in the browser.
ssr: false means:
Don't render this component on the server.
dynamic tells Next.js to load the component only when it is needed, instead of bundling it into the initial page load.
import("./project-preview") loads that file asynchronously.
.then((mod) => ({ default: mod.ProjectPreview })) adapts a named export into the default export shape that dynamic expects.
{ ssr: false } disables server-side rendering for this component, so it only renders in the browser.
*/

const ProjectPreview = dynamic(
    () => import("./project-preview").then((mod) => ({ default: mod.ProjectPreview })),
    { ssr: false },
);




const VIRTUAL_WIDTH = 1024;
const THUMBNAIL_WIDTH = 160;

export interface ProjectCardPProps {
    project: Project;
    files?: Record<string, string>;
    onRename: (id: string) => void;
    onDelete: (id: string) => void;
}


function getRelativeTime(dateString: string): string {
    const now = new Date();
    const then = new Date(dateString).getTime();
    const diffInSeconds = Math.floor((now.getTime() - then) / 1000);

    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["year", 60 * 60 * 24 * 365],
        ["month", 60 * 60 * 24 * 30],
        ["week", 60 * 60 * 24 * 7],
        ["day", 60 * 60 * 24],
        ["hour", 60 * 60],
        ["minute", 60],
    ];

    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    for (const [unit, secondsInUnit] of units) {
        if (diffInSeconds >= secondsInUnit) {

            const value = Math.floor(diffInSeconds / secondsInUnit);
            return formatter.format(-value, unit);
        }
    }
    return "just now";
};


function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

export function ProjectCard({ project, files, onRename, onDelete }: ProjectCardPProps) {
    const router = useRouter();
    const intials = getInitials(project.name);
    const thumbnailRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);
    const hasFiles = files && Object.keys(files).length > 0;
    const [previewReady, setPreviewReady] = useState(false);

    useEffect(() => {
        if (!thumbnailRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const containerWidth = entry.contentRect.width;
                setScale(containerWidth / VIRTUAL_WIDTH);
            }
        });
        observer.observe(thumbnailRef.current);
        return () => {
            observer.disconnect();
        };
    }, []);
    return (
        <div onClick={() => router.push(`/projects/${project.id}`)} >
            <Card className="group cursor-pointer gap-0 overflow-hidden p-0 transition-all duration-150 hover:border-white/20 hover:brightness-[1.05]">
                <div
                    ref={thumbnailRef}
                    className={cn("relative overflow-hidden",
                        hasFiles ?
                            "bg-[#1a1a1a]" :
                            "bg-gradient-to-br from-[#6d9cff] via-[#c084fc]/20 to-[#f87171]/20 ",
                    )}
                    style={{ height: THUMBNAIL_WIDTH }}>
                    {
                        hasFiles && scale > 0 ? (
                            <>
                                <div
                                    className="absolute inset-0 origin-top-left"
                                    style={{ transform: `scale(${scale})` }}>
                                    <ProjectPreview files={files} onLoad={() => setPreviewReady(true)} />
                                </div>
                                <div className="absolute inset-0 z-20">
                                    <div className={cn(
                                        "absolute inset-0 z-10 transition-opacity duration-500",
                                        previewReady ? "pointer-events-none opacity-0" : "opacity-100",
                                    )}>
                                        <div className="h-full w-full animate-pulse bg-[#1a1a1a] p-3">
                                            <div className="h-2.5 w-full rounded bg-white/5" />
                                            <div className="mt-3 h-12 w-3/4 rounded bg-white/5" />
                                            <div className="mt-3 space-y-2">
                                                <div className="h-2 w-full rounded bg-white/[0.03]" />
                                                <div className="h-2 w-5/6 rounded bg-white/[0.03]" />
                                                <div className="h-2 w-4/6 rounded bg-white/[0.03]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : files == undefined ? (
                            <Skeleton className="absolute inset-0 rounded-none" />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <span className="text-2xl font-bold text-muted-foreground">
                                    {intials}
                                </span>
                            </div>
                        )
                    }
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            {project.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {getRelativeTime(project.updatedAt)}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DropdownMenuItem
                                onClick={() => onRename(project.id)}>
                                <Pencil className="mr-2 size-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onDelete(project.id)}>
                                <Trash2 className="mr-2 size-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Card>
        </div>
    );
}


