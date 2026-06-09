import { Hono } from 'hono';
import { Env, AppVariables } from '../types';
import { Project } from '../types/project';


const projectRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();


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
    const versionKey=`${projectId}/v${project.currentVersion}/files.json`;
    const versionObject = await c.env.FILES.get(versionKey);
    if(!versionObject){
        return c.json({error:"Files not found for the current version",code:"FILES_NOT_FOUND"},404);
    }
    const version = await versionObject.json() as { files: Array<{ path: string; content: string }> };
    return c.json({ files: version.files, version: project.currentVersion  });
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
        const sanitized=
    }
});




export { projectRoutes };

