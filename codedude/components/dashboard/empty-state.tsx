import { FolderOpen } from "lucide-react";
import { Button } from "../ui/button";



export interface EmptyStateProps {
    onCreateProject: () => void;
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
            <div className="flex flex-col  items-center justify-center rounded-2xl bg-mutedd">
                <FolderOpen className="size-8 text-muted-foreground" />
                <h2 className="mt-2 text-xl font-semibold">No Project Yet</h2>
                <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                    Describe your Project to Codedude
                </p>
                <Button className="mt-6" onClick={onCreateProject}>
                    Create Project
                </Button>
            </div>
        </div>
    )

}