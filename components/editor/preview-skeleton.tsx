import { Skeleton } from "../ui/skeleton";






export function PreviewSkeleton() {
    return (
        <div className="flex h-full flex-col bg-background">
            <div className="flex h-10 items-center gap-2 border-b border-border px-3">
                <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-muted"/>
                    <div className="size-2.5 rounded-full bg-muted"/>
                    <div className="size-2.5 rounded-full bg-muted"/>
                </div>
                <Skeleton className="h-6 flex-1 rounded-md"/>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                <Skeleton className="h-8 w-48 rounded-md"/>
                <Skeleton className="h-4 w-64 rounded-md"/>
                <Skeleton className="mt-4 w-full rounded-lg"/>
            </div>
        </div>
    )
}