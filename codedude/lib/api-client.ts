import { Project, ProjectFile, VersionMeta } from '@/types/project';
import { ChatMessage } from '@/types/chat';

export const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

export interface ApiError {
    error: string;
    code: string;
}

type GetTokenFunction = () => Promise<string | null>;

// The <T> means:
// The caller will tell me what type of data the API returns.


// A Promise in JavaScript is an object that represents a value that will be available in the future.
async function authenticatedFetch<T>(
    getToken: GetTokenFunction,
    path: string,
    options: RequestInit = {},
    // RequestInit is a built-in TypeScript type that describes the configuration object you can pass as the second argument to fetch()
): Promise<T> {
    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token available');
    }
    // fetch() is a built-in JavaScript function used to send HTTP requests to a server and receive responses.
    const response = await fetch(`${WORKER_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options?.headers || {}),
        }
    });
    if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({
            error: 'Unknown error',
        }))) as { error: string; code?: string; retryAfter?: number };

        if (response.status === 429) {
            const retryAfter = errorBody.retryAfter || 60; // Default to 60 seconds if not provided
            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('rateLimitExceeded', {
                        detail: {
                            retryAfter,
                        },
                    })
                );
            }
        }
        throw new Error(errorBody.error || 'API request failed');
    }
    return response.json() as Promise<T>;
}
export function createApiClient(getToken: GetTokenFunction) {
    return {
        projects: {
            list: () =>
                authenticatedFetch<{ projects: Project[] }>(getToken, "/api/project"),
            get: (id: string) =>
                authenticatedFetch<{ project: Project }>(getToken, `/api/project/${id}`),

            getFiles: (id: string) =>
                authenticatedFetch<{ files: ProjectFile[]; version: number }>(getToken, `/api/project/${id}/files`), // ⚡ Changed projects -> project       
            create: (data: { name: string; model: string; description?: string }) =>
                authenticatedFetch<{ project: Project }>(getToken, "/api/project", {
                    method: "POST",
                    body: JSON.stringify(data),
                }),
            update: (id: string, data: { name?: string; model?: string }) =>
                authenticatedFetch<{ project: Project }>(getToken, `/api/project/${id}`, {
                    method: "PATCH",
                    body: JSON.stringify(data),
                }),
            delete: (id: string) =>
                authenticatedFetch<{ success: boolean }>(getToken, `/api/project/${id}`, {
                    method: "DELETE",
                }),

        },
        chats: {
            getHistory: (projectId: string) => authenticatedFetch<{ messages: ChatMessage[] }>(getToken, `/api/chat/${projectId}`),

        },
        credits: {
            get: () => authenticatedFetch<{
                remaining: number;
                total: number;
                plan: "free" | "pro";
                priodEnd: string;
                isUnlimited: boolean;

            }>(getToken, "/api/credits"),
        },
        versions: {
            // ✅ FIX 2: Added a trailing slash so Hono perfectly matches the route base array
            list: (projectId: string) => 
                authenticatedFetch<{ versions: VersionMeta[] }>(getToken, `/api/projects/${projectId}/versions/`),
        },
    };
}