import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { Project } from '../types/project';
import { sanitizeProjectName } from '../services/sanitize';
import { FREE_PROJECT_LIMIT, getCredits } from '../services/credits';
import { nanoid } from 'nanoid';
import { createInitialVersion } from '../ai/default-project';
import type { ProjectFile } from '../types/project';



/*  

KV keys:
key pattern               Value
-----------------------  ---------------------------------------------
project:{userId}          Project[] (list of all projects for a user, used for listing)
project:{projectId}      Project metadata (id, userId, name, model, currentVersion, timestamps)
chat:{projectId}         Array of chat messages for the project (for context in AI generations)
user-projects:{userId}  Array of project IDs owned by the user (for listing)

project-version:{projectId}:{versionNumber}
                          Snapshot of files for a project version
project-versions:{projectId}
                          Array of version numbers stored for the project


 */


const projectRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const getVersionKey = (projectId: string, versionNumber: number) =>
    `project-version:${projectId}:${versionNumber}`;

const getVersionIndexKey = (projectId: string) =>
    `project-versions:${projectId}`;

type VersionSnapshot = {
    files: ProjectFile[];
};


// Get all list of projects for the authenticated user
projectRoutes.get("/", async (c) => {
    const userId = c.var.userId;

    const projectIds = (await c.env.METADATA.get<string[]>(`user-projects:${userId}`, "json")) ||
        [];

    if (!projectIds || projectIds.length === 0) {
        return c.json({ projects: [] as Project[] });
    }
    const projects = await Promise.all(projectIds.map(async (projectId) => {
        return c.env.METADATA.get<Project>(`project:${projectId}`, "json");
    }));
    const filteredProjects = projects.filter((p): p is Project => p !== null).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return c.json({ projects: filteredProjects });
});


// Get a specific project by ID
projectRoutes.get("/:id", async(c)=> {
    const userId = c.var.userId;
    const projectId = c.req.param("id");
    const project = await c.env.METADATA.get<Project>(`project:${projectId}`, "json");
    if(!project){
         return c.json({error: "Project not found", code: "PROJECT_NOT_FOUND"}, 404);
    }
    if(project.userId !== userId){
        return c.json({error: "Unauthorized", code: "UNAUTHORIZED"}, 403);
    }
    return c.json({project});

});


// Get the files of a specific project by ID
projectRoutes.get("/:id/files",async(c)=> {
    const userId = c.var.userId;
    const projectId = c.req.param("id");
    const project=await c.env.METADATA.get<Project>(
        `project:${projectId}`,
        "json",
    );
    if(!project){
        return c.json({error:"Project Not found",code:"NOT_FOUND"},404);
    }
    if(project.userId !== userId){
        return c.json({error:"ACCESS_DENIED",code:"FORBIDDEN"},403);
    }
    const versionKey = getVersionKey(projectId, project.currentVersion);
    const version = await c.env.METADATA.get<VersionSnapshot>(versionKey, "json");
    if(!version){
        return c.json({error:"Files not found for the current version",code:"FILES_NOT_FOUND"},404);
    }
    return c.json({ files: version.files, version: project.currentVersion  });
});




/*
- POST /api/projects - Create a new project with an initial version (version 0)

----------------------------------------------------------
1 Create New Project with unique name
2 Project metadata stored in KV
3 the users Project id updated in KV
3 starter template file in KV as version 0
4 Request body: { name: string, model: string,description?: string }

 */
projectRoutes.post("/", async (c) => {
    const userId = c.var.userId;
    const body = await c.req.json<{
        name:string;
        model:string;
        description?: string;
    }>();
    const sanitizedName = sanitizeProjectName(body.name);
    if(!sanitizedName){
        return c.json({error:"Invalid project name. Please avoid special characters and keep it concise.",code:"INVALID_PROJECT_NAME"},400);
    }
    const credits = await getCredits(userId, c.env);
    if(credits.plan === "free" ){
        const existingIds = await c.env.METADATA.get<string[]>(
            `user-projects:${userId}`, 
            "json"
        );
        const proejctCount = existingIds ? existingIds.length : 0;
        if(proejctCount >= FREE_PROJECT_LIMIT){ 
            return c.json({error:"Free plan limit reached. Please upgrade to create more projects.",code:"PLAN_LIMIT_REACHED",
                limit: FREE_PROJECT_LIMIT,
                current: proejctCount,
            },400);
        }
    }

    const projectId = nanoid(12);
    const now = new Date();
    const project: Project = {
        id: projectId,
        userId,
        name: sanitizedName,
        model: body.model||"gpt-4o-mini",
        currentVersion: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
    };
    const initialVersion = createInitialVersion(project.name, project.model);
    const existingIds = await c.env.METADATA.get<string[]>(`user-projects:${userId}`, "json");
    const updatedIds = existingIds ? [...existingIds, projectId] : [projectId];
    await Promise.all([
        c.env.METADATA.put(`project:${projectId}`, JSON.stringify(project)),
        c.env.METADATA.put(`user-projects:${userId}`, JSON.stringify(updatedIds)),
        c.env.METADATA.put(getVersionKey(projectId, 0), JSON.stringify(initialVersion)),
        c.env.METADATA.put(getVersionIndexKey(projectId), JSON.stringify([0])),
    ]);
    return c.json({ project });
});


// *-Patch /api/projects/:id - Update project metadata (e.g., name, model) without creating a new version
projectRoutes.patch("/:id", async(c)=>{
    const userId = c.var.userId;
    const projectId = c.req.param("id");
    const project = await c.env.METADATA.get<Project>(`project:${projectId}`, "json");
    if(!project){
        return c.json({error:"Project Not found",code:"NOT_FOUND"},404);
    }
    if(project.userId !== userId){
        return c.json({error:"ACCESS_DENIED",code:"FORBIDDEN"},403);
    }
    const body = await c.req.json<{ name?: string; model?: string }>();
    if(body.name){
        const sanitized=sanitizeProjectName(body.name);
        if(sanitized){
            project.name=sanitized;
        }
    }
    if(body.model){
        project.model=body.model;  
    }
    project.updatedAt=new Date().toISOString();
    await c.env.METADATA.put(`project:${projectId}`, JSON.stringify(project));
    return c.json({ project });
});


// Delete /api/projects/:id - Delete a project and all its versions/files
projectRoutes.delete("/:id", async(c)=>{
    const userId = c.var.userId;
    const projectId = c.req.param("id");
    const project = await c.env.METADATA.get<Project>(`project:${projectId}`, "json");
    if(!project){
        return c.json({error:"Project Not found",code:"NOT_FOUND"},404);
    }
    if(project.userId !== userId){
        return c.json({error:"ACCESS_DENIED",code:"FORBIDDEN"},403);
    }

    const existingIds = await c.env.METADATA.get<string[]>(
        `user-projects:${userId}`,
        "json"
    );
    const updatedIds = (existingIds ?? []).filter((id) => id !== projectId);
    const versionNumbers = (await c.env.METADATA.get<number[]>(getVersionIndexKey(projectId), "json")) ?? [project.currentVersion];
    const deletePromises = versionNumbers.map((versionNumber) =>
        c.env.METADATA.delete(getVersionKey(projectId, versionNumber))
    );
    await Promise.all([
        c.env.METADATA.delete(`project:${projectId}`),
        c.env.METADATA.delete(`chat:${projectId}`),
        c.env.METADATA.delete(getVersionIndexKey(projectId)),
        c.env.METADATA.put(
            `user-projects:${userId}`,
            JSON.stringify(updatedIds)
        ),
        ...deletePromises,
    ]);
 
    return c.json({ message: "Project and all its versions/files deleted successfully" ,success: true});
});







export { projectRoutes };

