import { Project, ProjectFile } from '@/types/project';


export const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

export interface ApiError {
    error: string;
    code: string;
}

type GetTokenFunction = () => Promise<string | null>;

async function authenticatedFetch<T>(
    getToken: GetTokenFunction,
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token available');
    }
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
                authenticatedFetch<{ projects: Project[] }>(getToken,"/api/projects"),
            get:(id: string) =>
                authenticatedFetch<{ project: Project }>(getToken, `/api/projects/${id}`),
            getFiles:(id: string) =>
                authenticatedFetch<{ files: ProjectFile[];version:number }>(getToken, `/api/projects/${id}/files`),         
            create: (data:{name:string;model:string;description?:string}) =>
                authenticatedFetch<{ project: Project }>(getToken, "/api/projects",{ 
                    method: "POST",
                    body: JSON.stringify(data),
                }),
            update: (id: string, data: { name?: string; model?: string }) =>
                authenticatedFetch<{ project: Project }>(getToken, `/api/projects/${id}`, {
                    method: "PATCH",
                    body: JSON.stringify(data),
                }),
            delete: (id: string) =>
                authenticatedFetch<{ success: boolean }>(getToken, `/api/projects/${id}`, {
                    method: "DELETE",
                }),
            
        }
    };
}