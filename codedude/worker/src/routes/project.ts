import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { Project } from '../types/project';


const projectRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

projectRoutes.get("/", async (c) => {
    const userId = c.var.userId;

    const projectIds = (await c.env.METADATA.get<string[]>(`user-projects:${userId}`, "json")) ||
        [];

    if (!projectIds || projectIds.length === 0) {
        return c.json({ projects: [] });
    }
    const projects = await Promise.all(projectIds.map(async (projectId) => {
        return c.env.METADATA.get<Project>(`project:${projectId}`, "json");
    }));
    const filteredProjects = projects.filter((p): p is Project => p !== null).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return c.json({ projects: filteredProjects });
});
export { projectRoutes };

