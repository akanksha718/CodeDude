"use client";


import { useState } from "react";
import { Dialog, DialogDescription, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../ui/select";



const AI_MODELS = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gemini-2-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2-pro", label: "Gemini 2.0 Pro" },
    { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    { value: "claude-haiku-3-5", label: "Claude Haiku 3.5" },
    { value: "deepseek-v3", label: "DeepSeek V3" },
    { value: "deepseek-r1", label: "DeepSeek R1" },
] as const;


export interface CreateProjectData {
    name: string;
    description: string;
    model: string;
}

export interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateProjectData) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSubmit }: CreateProjectDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [model, setModel] = useState<string>(AI_MODELS[0].value);
    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) { return; }
        onSubmit({
            name: trimmedName,
            description: description.trim(),
            model,
        });
        setName("");
        setDescription("");
        setModel(AI_MODELS[0].value);

    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                        Give your project a name and describe your project to Codedude and it will generate the codebase for you.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="project-name" className="text-sm font-medium ">
                            Project Name
                        </label>
                        <Input id="project-name" placeholder="Project Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                    </div>
                    <div className='space-y-2'>
                        <label htmlFor="ai-model" className="text-sm font-medium ">
                            AI Model
                        </label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger id="ai-model" >
                                <SelectValue placeholder="Select an AI model" />
                            </SelectTrigger>
                            <SelectContent>
                                {AI_MODELS.map((aiModel) => (
                                    <SelectItem key={aiModel.value} value={aiModel.value}>
                                        {aiModel.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="project-description" className="text-sm font-medium ">
                            Project Description
                        </label>
                        <Input
                            id="project-description"
                            placeholder="Describe your project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                            }}
                        >
                            Cancel

                        </Button>
                        <Button type="submit"
                            disabled={!name.trim() || !description.trim()}>
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}