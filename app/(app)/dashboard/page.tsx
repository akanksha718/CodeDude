"use client";
import { CreateProjectDialog, EmptyState } from '@/components/dashboard';
import { ProjectGrid } from '@/components/dashboard/project-grid';
import { Button } from '@/components/ui/button';
import { Dialog ,DialogContent,DialogTitle,DialogDescription,DialogHeader,DialogFooter} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { createApiClient } from '@/lib/api-client';
import { Project } from '@/types/project';
import { useAuth } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,AlertDialogFooter ,AlertDialogCancel, AlertDialogAction} from '@/components/ui/alert-dialog';
import React, { useEffect } from 'react'
import { toast } from 'sonner';


const Dashboardpage = () => {
  const { getToken } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
// Record is a utility type that lets you create an object type with specific key and value types.
  const [projectFiles, setProjectFiles] = React.useState<
    Record<string, Record<string, string> | undefined>>({});
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  // useRef creates a reference object that persists across re-renders. without causing the component to re-render when the value changes.
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  // Normally, every time a component re-renders, functions are recreated.
  // useCallback memoizes the function, so it only gets recreated if its dependencies change. 
  // This is important for functions that are passed as props to child components or used in useEffect, 
  // to prevent unnecessary re-renders or effect executions.
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

  const handleRename = async (id :string) => {
    const project = projects.find((p) => p.id === id);
    if(!project) return;
    setRenameTarget(id);
    setRenameValue(project.name);
    // setTimeout schedules some code to run later.
    setTimeout(() => {
      // Selects all text inside the input.
      renameInputRef.current?.select();
      // Moves the cursor into the input.Equivalent to the user clicking the input.
      renameInputRef.current?.focus();
    }, 50);
  };

  async function confirmRename() {
    if(!renameTarget) return;
    const trimmed = renameValue.trim();
    const original = projects.find((p) => p.id === renameTarget);
    if(!trimmed || trimmed === original?.name) {
      setRenameTarget(null);
      return;
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === renameTarget ? { ...p, name: trimmed } : p))
    );
    setRenameTarget(null);
    try {
      const client = createApiClient(getToken);
      await client.projects.update(renameTarget, { name: trimmed });
      toast.success("Project renamed");
    } catch (error) {
      setProjects((prev) =>
        prev.map((p) => p.id === renameTarget ? { ...p, name: original?.name || p.name } : p),
      );
      
      const message = error instanceof Error ? error.message : "Failed to Rename Project";
      toast.error(message);
    }
  }

  async function confirmDelete() {
    if(!deleteTarget) return;
    try{
      const client = createApiClient(getToken);
      await client.projects.delete(deleteTarget);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget));
      setProjectFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[deleteTarget];
        return newFiles;
      });
      toast.success("Project deleted");

    }catch(err){
      toast.error(err instanceof Error ? err.message : "Failed to Delete Project");
    }finally{
      setDeleteTarget(null);
    }
  }

  const handleDelete = async (id :string) => {
    setDeleteTarget(id);
  }

  const handleCreateProjecct = async (data :{ name: string ;model: string ;description?: string }) => {
    try {
      const client = createApiClient(getToken);
      const response = await client.projects.create(data);
      const description = data.description?.trim();
      const path = description
        ? `/project/${response.project.id}?prompt=${encodeURIComponent(description)}`
        : `/project/${response.project.id}`;
      router.push(path);
      setDialogOpen(false);

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
      <Dialog
      open={renameTarget !== null}
      onOpenChange={(open) => {
        if(!open) setRenameTarget(null);
      }}
      >
        <DialogContent className="sm:max-h-[400px]">
          <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Enter a new name for your project.
          </DialogDescription>
        </DialogHeader>
        <Input
        ref={renameInputRef}
        value={renameValue}
        onChange={(event)=> setRenameValue(event.target.value)}
        onKeyDown={(event)=>{
          if(event.key==="Enter"){
            event.preventDefault();
            confirmRename();
          }
          if(event.key==="Escape"){
            setRenameTarget(null);
          }
        }}
        placeholder='Project Name'
        maxLength={100}/>
        <DialogFooter>
          <Button
          variant="outline"
          size="sm"
          onClick={() => setRenameTarget(null)}
          >
            Cancel
          </Button>
          <Button
          size="sm"
          onClick={confirmRename}
          disabled={!renameValue.trim()|| 
            renameValue.trim() === projects.find((p) => p.id === renameTarget)?.name
          }
          >
            Rename
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if(!open) setDeleteTarget(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
            variant="destructive"
            onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
};

export default Dashboardpage