import { getModelById } from "@/lib/model";
import { ChatMessage, ImageAttachment } from "@/types/chat";
import React, { useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Code, MessageSquare, Sparkles } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";


export interface ChatPanelProps {
    messages: ChatMessage[];
    isStreaming: boolean;
    onSendMessage: (message: string, images?: ImageAttachment[]) => void;
    creditsRemaining: number;
    isCreditExhausted: boolean;
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    userPlan: "free" | "pro";
}

export function ChatPanel({
    messages,
    isStreaming,
    onSendMessage,
    creditsRemaining,
    isCreditExhausted,
    selectedModelId,
    onModelChange,
    userPlan }: ChatPanelProps) {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const selectedModel = getModelById(selectedModelId);
    const supportVision = selectedModel?.supportsVision ?? false;
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    return (
        <div className="flex h-full min-h-0 flex-col bg-background">
            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-5 p-4">
                    {
                        messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="relative mb-5">
                                    <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
                                    <div className="relative flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                                        <Sparkles className="size-7 text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-base font-semibold">What do you want to build?</h3>
                                <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
                                    Describe your project
                                </p>
                                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                    {[
                                        { icon: Code, label: "A landing page" },
                                        { icon: MessageSquare, label: "A Chat App" },
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion.label}
                                            onClick={() => onSendMessage(suggestion.label)}
                                            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground "
                                        >
                                            <suggestion.icon className="size-3" />
                                            {suggestion.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    {
                        messages.map((message, index) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isStreaming={isStreaming && message.role === "assistant" && index === messages.length - 1}
                                isAutoHealInProgress={isStreaming && message.role === "user" && index === messages.length - 2}
                            />
                        ))
                    }
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            <ChatInput
                onSend={onSendMessage}
                creditsRemaining={creditsRemaining}
                isStreaming={isStreaming}
                isCreditExhausted={isCreditExhausted}
                supportVision={supportVision}
            />
        </div>
    );
}
