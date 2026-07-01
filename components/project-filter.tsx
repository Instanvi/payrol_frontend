"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjectsQuery } from "@/hooks/queries/use-projects-query"

export function ProjectFilter({
  value,
  onChange,
}: {
  value?: string
  onChange: (projectId: string | undefined) => void
}) {
  const { data: projects = [] } = useProjectsQuery()

  return (
    <Select
      value={value ?? "all"}
      onValueChange={(next) =>
        onChange(next === "all" ? undefined : next)
      }
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="All projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All projects</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
