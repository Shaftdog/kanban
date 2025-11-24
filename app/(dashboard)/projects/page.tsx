'use client'

import { useState } from 'react'
import { useProjects, useDeleteProject } from '@/lib/hooks'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectDialog } from '@/components/projects/project-dialog'
import { Button } from '@/components/ui/button'

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects()
  const deleteProject = useDeleteProject()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)

  const handleEdit = (project: any) => {
    setSelectedProject(project)
    setDialogOpen(true)
  }

  const handleDelete = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject.mutateAsync(projectId)
    }
  }

  const handleNewProject = () => {
    setSelectedProject(null)
    setDialogOpen(true)
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Error loading projects: {error.message}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Projects
        </h1>
        <Button onClick={handleNewProject}>
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-full mb-2" />
              <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => handleEdit(project)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No projects yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Get started by creating your first project
          </p>
          <Button onClick={handleNewProject}>Create Project</Button>
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
      />
    </div>
  )
}
