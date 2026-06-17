
import { Env } from "../../types";
import type {LanguageModel} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";


export interface ModelConfig{
    provider:"openai" | "anthropic" | "google" | "deepseek" ;
    displayName:string;
    apiModelId:string;
    creditCost:number;
    tier:"fast"|"premium";
    speed:"fast"|"medium"|"very-fast";
    quality:"high"|"medium";
    description:string;
    supportsVision:boolean;
    maxOutputTokens:number;
}

export const MODEL_REGISTRY:Record<string,ModelConfig> = {
    "claude-sonnet-4-5":{
        provider:"anthropic",
        displayName:"Claude Sonnet 4.5",
        apiModelId:"claude-sonnet-4-5-20250929",
        creditCost:2,
        tier:"premium",
        speed:"medium",
        quality:"high",
        description:"Claude Sonnet 4.5 is a high-quality model designed for complex tasks and nuanced understanding.",
        supportsVision:true,
        maxOutputTokens:16384
    },
    "claude-haiku-3-5":{
        provider:"anthropic",
        displayName:"Claude Haiku 3.5",
        apiModelId:"claude-haiku-3-5-20251001",
        creditCost:1,
        tier:"fast",
        speed:"fast",
        quality:"medium",
        description:"Claude Haiku 3.5 is a fast and efficient model for straightforward tasks.",
        supportsVision:true,
        maxOutputTokens:16384,
    },
    "gpt-4o":{
        provider:"openai",
        displayName:"GPT-4o",
        apiModelId:"gpt-4o",
        creditCost:2,
        tier:"premium",
        speed:"medium",
        quality:"high",
        description:"GPT-4o is a high-quality model designed for complex tasks and nuanced understanding.",
        supportsVision:true,
        maxOutputTokens:16384
    },
    "gpt-4o-mini":{
        provider:"openai",
        displayName:"GPT-4o Mini",
        apiModelId:"gpt-4o-mini",
        creditCost:1,
        tier:"fast",
        speed:"fast",
        quality:"medium",
        description:"GPT-4o Mini is a fast and efficient model for straightforward tasks.",
        supportsVision:true,
        maxOutputTokens:16384
    },
    "gemini-2-flash":{
        provider:"google",
        displayName:"Gemini 2.0 Flash",
        apiModelId:"gemini-2.0-flash",
        creditCost:1,
        tier:"fast",
        speed:"very-fast",
        quality:"medium",
        description:"Gemini 2.0 Flash is a fast and efficient model for straightforward tasks.",
        supportsVision:true,
        maxOutputTokens:16384
    },
    "gemini-2-pro":{
        provider:"google",
        displayName:"Gemini 2.0 Pro",
        apiModelId:"gemini-2.0-pro",
        creditCost:2,
        tier:"premium",
        speed:"medium",
        quality:"high",
        description:"Gemini 2.0 Pro is a high-quality model designed for complex tasks and nuanced understanding.",
        supportsVision:true,
        maxOutputTokens:16384
    },
    "deepseek-v3":{
        provider:"deepseek",
        displayName:"DeepSeek V3",
        apiModelId:"deepseek-chat",
        creditCost:1,
        tier:"premium",
        speed:"medium",
        quality:"high",
        description:"DeepSeek V3 is a high-quality model designed for complex tasks and nuanced understanding.",
        supportsVision:false,
        maxOutputTokens:8192,
    },
    "deepseek-r1":{
        provider:"deepseek",
        displayName:"DeepSeek R1",
        apiModelId:"deepseek-reasoner",
        creditCost:1,
        tier:"fast",
        speed:"fast",
        quality:"medium",
        description:"DeepSeek R1 is a fast and efficient model for straightforward tasks.",
        supportsVision:false,
        maxOutputTokens:16384,
    }

}


export const DEFAULT_MODEL = "gpt-4o-mini";

export function getModel(model:string,env:Env):LanguageModel 
{
    const config =  MODEL_REGISTRY[model];
    if(!config)
    {
        throw new Error(`Model ${model} not found in registry`);
    }

    switch(config.provider){
        case "anthropic":
            return createAnthropic({apiKey:env.ANTHROPIC_API_KEY})(
                config.apiModelId
            );
        case "openai":
            return createOpenAI({apiKey:env.OPENAI_API_KEY})(
                config.apiModelId
            );
        case "google":
            return createGoogleGenerativeAI({apiKey:env.GOOGLE_AI_API_KEY})(
                config.apiModelId
            );
        case "deepseek":
            return createDeepSeek({apiKey:env.DEEPSEEK_API_KEY})(
                config.apiModelId
            );

        default: throw new Error(`Provider ${config.provider} not supported`);
    }
}

