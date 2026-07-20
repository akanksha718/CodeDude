

import {Skeleton} from "@/components/ui/skeleton";

export function EditorSkeleton() {
    return(
        <div className="flex h-full bg-background">
            <div className="w-52 shrink-0 border-r border-border p-3">
                <Skeleton className="mb-3 h-4 w-20" />
                <div className="space-y-2 pl-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3.5 w-28" />
                    <div className="space-y-2 pl-3">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3.5 w-24" />
                    </div>
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-20" />
                </div>
            </div>
            <div className="flex flex-1 flex-col p-4">
                <div className="mb-3 flex gap-1">
                    <Skeleton className="h-7 w-24 rounded-md" />
                    <Skeleton className="h-7 w-20 rounded-md" />
                </div>
                <div className="space-y-2">
                    {Array.from({ length: 15 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <Skeleton className="h-3.5 w-6 shrink-0" />
                            <Skeleton className="h-3.5 rounded" 
                            style={{width:`${Math.random()*60+20}%`}} />
                        </div>   
                    ))}
                </div>
            </div>

        </div>
    )
}