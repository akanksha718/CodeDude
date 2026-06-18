"use client";

import { getModelById } from "@/lib/model";
import { ChatMessage } from "@/types/chat";



export interface MessageBubbleProps {
    message: ChatMessage;
    isStreaming?: boolean;
    isAutoHealInProgress?: boolean;
}

const FILE_TAG_REGEX= /<file\s+path="[^"]+">\n?[\s\S]*?\n?<\/file>/g;

const PARTIAL_FILE_REGEX = /<file\s+path="[^"]+">[\s\S]*$/;

function stripFileTags(content: string,isStreaming: boolean): string {
    let cleaned= content.replace(FILE_TAG_REGEX, "").replace(/\n{3,}/g, "\n\n");
    cleaned= cleaned.replace(PARTIAL_FILE_REGEX, "");
    cleaned= cleaned.replace(/<\/file>/g, "");
    return cleaned.trim();
}

function hasFileTags(content:string): boolean {
    return /<file\s+path="/.test(content);
}




function formatModelName(modelId: string): string {
    const modelInfo=getModelById(modelId);
    if(modelInfo) {
        return modelInfo.name;
    }
    if(modelId.includes("gpt-4o")) {
        return "GPT-4o";
    }
    if(modelId.includes("gemini")) {
        return "Gemini";
    }
    if(modelId.includes("claude")) {
        return "Claude";
    }
    if(modelId.includes("gpt-4o-mini")) {
        return "GPT-4o Mini";
    }
    if(modelId.includes("deepseek")) {
        return "DeepSeek";
    }
    return modelId;
}


const AUTO_HEAL_PREFIX="the app has a build /runtime error"

function extractAttemptNumber(content: string): number  {
    const match= content.match(/\(attempt (\d+)\/\d+\)/);
    return (match )?parseInt(match[1], 10): 1;
    
}


function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([],{hour: "numeric", minute: "2-digit"});
}


export function MessageBubble({ 
    message, 
    isStreaming, 
    isAutoHealInProgress
}: MessageBubbleProps) {
    const cleanedContent= stripFileTags(message.content, !!isStreaming );
    return <>
    MessageBubble
    </>
}
