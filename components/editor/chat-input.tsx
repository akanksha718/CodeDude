
import { cn } from "@/lib/utils";
import { ImageAttachment } from "@/types/chat";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Paperclip, SendHorizonal } from "lucide-react";
import { X } from "lucide-react";
import { toast } from "sonner";


const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];


export interface ChatInputProps {
    onSend: (message: string, images?: ImageAttachment[]) => void;
    creditsRemaining: number;
    isStreaming: boolean;
    isCreditExhausted: boolean;
    supportVision: boolean;
}

export function ChatInput({ onSend, creditsRemaining, isStreaming, isCreditExhausted = false, supportVision = false }: ChatInputProps) {
    const [value, setValue] = useState("");
    const textararef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachedImages, setAttachedImages] = useState<ImageAttachment[]>([]);

    useEffect(() => {
        textararef.current?.focus();
    }, [])

    useEffect(() => {
        const textarea = textararef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
        }

    }, [value])

    const processFile = useCallback(
        async (file: File): Promise<ImageAttachment | null> => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                toast.error(`File type not supported. Please upload a JPEG, PNG, GIF, or WebP image.`);
                return null;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                toast.error(`File size exceeds the maximum limit of ${MAX_IMAGE_SIZE} MB.`);
                return null;
            }
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result as string;
                    const base64 = dataUrl.split(",")[1];
                    resolve({ mediaType: file.type, base64, name: file.name });

                };
                reader.onerror = () => {
                    toast.error(`Failed to read file: ${file.name}`);
                    resolve(null);
                };
                reader.readAsDataURL(file);
            });
        }, []);

    const handleFiles = useCallback(
        async (files: FileList | File[] | null) => {
            const remaining = MAX_IMAGES - attachedImages.length;
            const filesToProcess = Array.from(files || []).slice(0, remaining);
            if (Array.from(files || []).length > remaining) {
                toast.error(`You can only attach up to ${MAX_IMAGES} images.`);
            }
            const results = await Promise.all(filesToProcess.map(processFile));
            const valid = results.filter(Boolean) as ImageAttachment[];
            if (valid.length > 0) {
                setAttachedImages(prev => [...prev, ...valid]);
            }
        }, [attachedImages.length, processFile]);

    const handleFileSelect = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            handleFiles(event.target.files);
            event.target.value = "";
        }, [handleFiles]);




    const handleDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            if (!supportVision) return;
            const imageFiles: File[] = [];
            for (const file of Array.from(event.dataTransfer.files)) {
                if (file.type.startsWith("image/")) {
                    imageFiles.push(file);
                }
            }
            if (imageFiles.length > 0) {
                handleFiles(imageFiles);
            }

        }, [handleFiles, supportVision]
    );


    const handlePaste = useCallback(
        (event: React.ClipboardEvent) => {
            if (!supportVision) return;
            const items = event.clipboardData?.items;
            if (!items) return;
            const imageFiles: File[] = [];
            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) imageFiles.push(file);
                }
            }
            if (imageFiles.length > 0) {
                event.preventDefault();
                handleFiles(imageFiles);
            }

        }, [supportVision, handleFiles]
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    }

    const handleSend = useCallback(() => {
        const trimmedValue = value.trim();
        if ((!trimmedValue && attachedImages.length === 0) ||
            isStreaming || isCreditExhausted) {
            return;
        }
        onSend(trimmedValue || "Describe this image", attachedImages.length > 0 ? attachedImages : undefined);
        setValue("");
        setAttachedImages([]);

    }, [value, attachedImages, onSend, isStreaming, isCreditExhausted]);

    const removeImage = useCallback((index: number) => {
        setAttachedImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const isDisabled = isStreaming || isCreditExhausted;

    const hasContent = value.trim().length > 0 || attachedImages.length > 0;




    return (

        <div className="px-3 pb-3 pt-1.5" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
            <div
                className={cn("flex flex-col rounded-xl border border-border/50 bg-background transition-colors focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/10",
                )}>
                {
                    attachedImages.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 px-3 pt-2">
                            {
                                attachedImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className="group/thumb relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/50">
                                        <img
                                            src={`data:${img.mediaType};base64,${img}`}
                                            alt="Attached"
                                            className="size-full object-cover" />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover/thumb:opacity-100"

                                        >
                                            <X className="size-2.5" />

                                        </button>
                                    </div>
                                ))
                            }
                            <span
                                className={cn(
                                    "text-[11px] font-medium",
                                    attachedImages.length >= MAX_IMAGES ? "text-amber-500" : "text-muted-foreground/60"
                                )}
                            >
                                {attachedImages.length} /{MAX_IMAGES}
                            </span>
                        </div>
                    )
                }

                <div className=" flex items-end gap-2 px-3 py-2">
                    {
                        supportVision && (
                            <Button
                                type="button"
                                size="icon-xs"
                                onClick={() => fileInputRef.current?.click()}
                                variant="ghost"
                                disabled={isDisabled || attachedImages.length >= MAX_IMAGES}
                                className="shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                                <Paperclip className="size-3.5" />
                            </Button>
                        )
                    }
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <textarea
                        ref={textararef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={isCreditExhausted ? "You have exhausted your credits. Please upgrade to continue." : isStreaming ? "Ai is generating response..." : "Describe what you want to build..."}
                        disabled={isDisabled}
                        rows={1}
                        className={cn("flex-1 resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none"
                            , "min-h-[20px] max-h-[200px]",
                            isDisabled && "cursor-not-allowed opacity-50"
                        )}
                    />
                    <Button
                        size="icon-xs"
                        onClick={handleSend}
                        disabled={!hasContent || isDisabled}
                        className={cn("rounded-lg shrink-0 transition-all duration-150",
                            hasContent && !isDisabled
                                ? "opacity-100 scale-100"
                                : "opacity-30 scale-95"
                        )}
                    >
                        <SendHorizonal className="size-3.5" />
                    </Button>

                </div>
            </div>
        </div>
    )
}