"use client";
import { CreateProjectDialog, EmptyState } from '@/components/dashboard';
import { ProjectGrid } from '@/components/dashboard/project-grid';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createApiClient } from '@/lib/api-client';
import { Project } from '@/types/project';
import { useAuth } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { toast } from 'sonner';



const Dashboardpage = () => {
  const { getToken } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const [projectFiles, setProjectFiles] = React.useState<
    Record<string, Record<string, string> | undefined>>({});

  const fetchProjects = React.useCallback(async () => {
    try {
      const client = createApiClient(getToken);
      const data = await client.projects.list();
      setProjects(data.projects);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);


  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);


  useEffect(() => {
    if(projects.length === 0) return;

    let mounted = true;
    const client = createApiClient(getToken);

    projects.forEach((project) => {
      if(projectFiles[project.id] !== undefined) return;

      client.projects
      .getFiles(project.id)
      .then((data) => {
        if(!mounted) return;
        const filesRecord: Record<string, string> = {};
        for (const file of data.files) {
          filesRecord[file.path] = file.content;
        }
        setProjectFiles((prev) => ({ ...prev, [project.id]: filesRecord }));
      })
      .catch((err) => {
        if(!mounted) return;
        setProjectFiles((prev) => ({ ...prev, [project.id]: {} }));
      });
    });

    return () => {
      mounted = false;
    };
  }, [projects , getToken , projectFiles]);

  const handleRename = async (id :string) => {}
  const handleDelete = async (id :string) => {}
  const handleCreateProjecct = async (data :{ name: string ;model: string ;description?: string }) => {
    try {
      const client = createApiClient(getToken);
      const response = await client.projects.create(data);
      try{
        sessionStorage.setItem(
          `pendingPrompt:${response.project.id}`,
           data.description?.trim() || "");
      }catch(err){
        console.warn("Failed to save pending prompt in sessionStorage", err);
      }
      router.push(`/projects/${response.project.id}`);

    } catch (error) {
      console.error("Failed to create project", error);
      const message = error instanceof Error ? error.message : "Failed to Create Project";
      toast.error(message);
    }
  }
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex  items-center justify-between">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Project
        </Button>
      </div>
      {
        loading ? (
        <div className=" grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[240px] rounded-xl" />

            ))   
          }
        </div>) : projects.length > 0 ? <ProjectGrid 
        
        projects={projects} 
        ProjectFiles={projectFiles} 
        onNewProject={() => setDialogOpen(true)} 
        onRename={handleRename} 
        onDelete={handleDelete} /> : <EmptyState onCreateProject={() => setDialogOpen(true)} />
      }
      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreateProjecct} />
    </div>
  )
};

export default Dashboardpage