"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useCreateProjectMutation } from "@/hooks/mutations/use-project-mutations"
import { useProjectsQuery } from "@/hooks/queries/use-projects-query"
import type { Project } from "@/lib/types"
import { PlusIcon } from "lucide-react"

function ProjectsPageContent() {
  const { data: projects = [], isLoading } = useProjectsQuery()
  const createMutation = useCreateProjectMutation()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [description, setDescription] = React.useState("")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createMutation.mutateAsync({
      name,
      code: code || undefined,
      description: description || undefined,
    })
    setOpen(false)
    setName("")
    setCode("")
    setDescription("")
    toast.success("Project created")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Organize employees and pay runs by project"
        actions={
          <Button onClick={() => setOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New project
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No projects yet. Create one to assign employees and run payroll.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-code">Code (optional)</Label>
                <Input
                  id="project-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            {project.code && (
              <CardDescription>{project.code}</CardDescription>
            )}
          </div>
          <Badge variant={project.status === "active" ? "default" : "secondary"}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{project.employeeCount} employees</span>
          <span>{project.payRunCount} pay runs</span>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/dashboard/projects/${project.id}`}>View project</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <ProjectsPageContent />
    </Suspense>
  )
}
