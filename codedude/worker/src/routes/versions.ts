
import { Hono } from "hono";
import { Env, AppVariables } from "../types";
import { Project, Version, VersionMeta } from "../types/project";



const versionsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const getVersionKey = (projectId: string, versionNumber: number) =>
    `project-version:${projectId}:${versionNumber}`;





/**
* @param projectId - the project id to look upto
* @param userId - the authenticated user id
* @param env - the environment bindings to access metadata
* @return - project owened by user
*/
async function getOwnedProject(
    projectId: string,
    userId: string,
    env: Env
): Promise<Project | null> {
    const project = await env.METADATA.get<Project>(`project:${projectId}`, "json");
    if (!project || project.userId !== userId) {
        return null;
    }

    return project;
}

/**
 * @param version -  Full version object
 * @return VersionMeta without files array
 */

function toVersionMeta(version:Version): VersionMeta {
    return {
        versionNumber: version.versionNumber,
        type: version.type,
        prompt: version.prompt,
        model: version.model,
        createdAt: version.createdAt,
        fileCount: version.fileCount??version.files?.length??0,
        changedFiles: version.changedFiles,
        restoredFrom: version.restoredFrom,
    }
}

versionsRoutes.get("/", async (c) => {
    const userId = c.var.userId;
    const projectId = c.req.param("id");
    if(!projectId){
        return c.json({error: "Project ID is required", code: "PROJECT_ID_REQUIRED"}, 400);
    }
    const project = await getOwnedProject(projectId, userId, c.env);
    if (!project) {
        return c.json({ error: "Project not found or unauthorized", code: "PROJECT_NOT_FOUND" }, 404);
    }
    const versionPromoises:Promise<VersionMeta | null>[] = [];
    for(let v=0;v<=project.currentVersion;v++){
        versionPromoises.push(
            c.env.METADATA.get<Version>(getVersionKey(projectId, v), "json").then((version) => (version ? toVersionMeta(version) : null))
            .catch(
                ()=>null,
            ),
        );
    }
    const versions = (await Promise.all(versionPromoises))
        .filter((v): v is VersionMeta => v !== null)
        .sort((a, b) => b.versionNumber - a.versionNumber);

    return c.json({ versions });
});


export { versionsRoutes };