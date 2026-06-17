"use client";
import { Theme, useTheme } from "../theme-provider";
import { ArrowLeft, Check, ChevronDown, HelpCircle, Monitor, Moon ,Palette,Settings,Sun, Trash} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React, { useRef } from "react";
import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger,DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,AlertDialogDescription } from "../ui/alert-dialog";



export interface ProjectMenuProps {
    projectId:string;
    projectName:string;
    creditsRemaining:number;
    creditsTotal:number;
    onRename:(newName:string) => void;
    onDelete:() => void;
    userPlan:"free" | "pro";
}


const THEME_OPTIONS:{value:Theme, label:string,icon:typeof Moon}[] =[
    {value:"light",label:"Light",icon:Sun},
    {value:"dark",label:"Dark",icon:Moon},
    {value:"system",label:"System",icon:Monitor},
];


export function ProjectMenu({
    projectId,
    projectName,
    creditsRemaining,
    creditsTotal,
    onRename,
    onDelete,
    userPlan,
}:ProjectMenuProps){
    const {user} = useUser();
    const router= useRouter();
    const {theme,setTheme}=useTheme();
    const [isRenameOpen,setIsRenameOpen] = useState(false);
    const [isDeleteOpen,setIsDeleteOpen] = useState(false);
    const [renameValue,setRenameValue] = useState(projectName);
    const renameInputRef = useRef<HTMLInputElement>(null);

    useEffect(()=>{
        setRenameValue(projectName);
    },[projectName]);

    useEffect(()=>{
        if(!isRenameOpen){
            return;
        }
        const timer = setTimeout(()=>{
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        },50);
        return () => clearTimeout(timer);
    },[isRenameOpen]);

    function handleRenameConfirm(){
        const trimmed = renameValue.trim();
        if(trimmed && trimmed !== projectName){
            onRename(trimmed);
        }
        setIsRenameOpen(false);
    }
    
    function handleDeleteKeyDown(event:React.KeyboardEvent<HTMLDivElement>){
        if(event.key === "Enter" ){
            event.preventDefault();
            handleRenameConfirm();
        }
        if(event.key === "Escape"){
            setIsRenameOpen(false);
        }


    }
    const isUnlimited= creditsRemaining === -1;
    const isPro = userPlan === "pro";
    const displayRemaining = isUnlimited ? creditsTotal : (creditsRemaining??0);
    const progressPercent = isUnlimited 
    ? 100 
    : creditsTotal > 0?
    (displayRemaining / creditsTotal) * 100
    : 0;

    return (
        <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center cursor-pointer gap-1 rounded-md px-1 py-0.5 transition-colors duration-150 hover:bg-accent/50 sm:px-1.5">
                    <span className="max-w-[80px] truncate text-sm font-medium sm:max-w-[180px] sm:text-base">{projectName}</span>
                    <ChevronDown className="size-3 text-muted-foreground sm:size-3.5"/>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem onClick={() => router.push(`/dashboard`)}>
                    <ArrowLeft className="size-4 mr-2"/>
                    Go to Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center gap-3 px-2 py-2">
                    {
                        user?.imageUrl ? (
                        <img 
                        src={user.imageUrl} 
                        alt="User Avatar" 
                        className="size-8 rounded-full"
                        />
                    ) : (
                            <div className="size-8 rounded-full bg-secondary"/>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{user?.fullName?? "User"}</span>
                            <Badge 
                            variant="secondary"
                            className="mt-0.5 w-fit text-[10px] px-1.5 py-0"
                            >
                                {
                                    isPro ? "Pro Plan" : "Free Plan"
                                }
                                
                            </Badge>
                        </div>
                </div>
                <div className="px-2 pb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Credits</span>
                        <span>
                            {
                                isUnlimited ? "Unlimited" : `${creditsRemaining ?? 0} / ${creditsTotal}`
                            }
                        </span>

                    </div>
                    {
                        !isUnlimited && (
                            <div className="h-1.5 w-full rounded-full bg-secondary">
                                <div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: `${Math.min(100,progressPercent)}%` }} />
                             </div>   
                        )
                    }
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("settings")}>
                    <Settings className="size-4 mr-2"/>
                    Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={()=> setIsRenameOpen(true)}>
                    <Pencil className="size-4 mr-2"/>
                    Rename Project
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Palette className="size-4 mr-2"/>
                        Appearance
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {
                            THEME_OPTIONS.map((option) => (
                                <DropdownMenuItem
                                key={option.value}
                                onSelect={() => setTheme(option.value)}
                                >
                                    <option.icon className="size-4 mr-2"/>
                                    {option.label}
                                    {theme === option.value && (
                                        <Check className="size-3.5 text-primary ml-auto"/>)}
                                </DropdownMenuItem>
                            ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />


                <DropdownMenuItem
                onClick={() => setIsDeleteOpen(true)}
                className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 size-4"/>
                    Delete Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                onClick={()=> router.push(`/settings`)}>
                    <HelpCircle className="size-4 mr-2"/>
                    Help
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Rename Project</DialogTitle>
                    <DialogDescription>
                        Enter a New Name for Your Project 
                    </DialogDescription>
                </DialogHeader>
                <Input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleDeleteKeyDown}
                placeholder="Project Name"
                maxLength={100}
                />
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={() => setIsRenameOpen(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleRenameConfirm}
                    disabled={!renameValue?.trim() || renameValue.trim() === projectName}>
                        Rename
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>


        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your project and remove all data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-white hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
        
}

