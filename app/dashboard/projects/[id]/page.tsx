"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useExportProjectPayrollMutation,
  useSetProjectEmployeesMutation,
} from "@/hooks/mutations/use-project-mutations"
import { useActiveEmployeesQuery } from "@/hooks/queries/use-employees-query"
import {
  useProjectEmployeesQuery,
  useProjectQuery,
} from "@/hooks/queries/use-projects-query"
import { usePaymentsQuery } from "@/hooks/queries/use-payments-query"
import { DownloadIcon, ArrowLeftIcon } from "lucide-react"

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const { data: project, isLoading: projectLoading } = useProjectQuery(projectId)
  const { data: assignedEmployees = [], isLoading: assignedLoading } =
    useProjectEmployeesQuery(projectId)
  const { data: allEmployees = [] } = useActiveEmployeesQuery()
  const { data: payRunsData } = usePaymentsQuery({
    projectId,
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  })

  const setEmployeesMutation = useSetProjectEmployeesMutation()
  const exportMutation = useExportProjectPayrollMutation()

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    setSelectedIds(new Set(assignedEmployees.map((e) => e.id)))
  }, [assignedEmployees])

  function toggleEmployee(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function saveEmployees() {
    await setEmployeesMutation.mutateAsync({
      projectId,
      employeeIds: [...selectedIds],
    })
    toast.success("Project employees updated")
  }

  if (projectLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project not found.</p>
  }

  const payRuns = payRunsData?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.code ?? "Project details"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/projects">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              onClick={() => exportMutation.mutate(projectId)}
              disabled={exportMutation.isPending}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project info</CardTitle>
            <CardDescription>
              {project.description ?? "No description"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              <Badge variant={project.status === "active" ? "default" : "secondary"}>
                {project.status}
              </Badge>
            </p>
            <p>
              <span className="text-muted-foreground">Employees:</span>{" "}
              {project.employeeCount}
            </p>
            <p>
              <span className="text-muted-foreground">Pay runs:</span>{" "}
              {project.payRunCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pay runs</CardTitle>
            <CardDescription>Recent pay runs for this project</CardDescription>
          </CardHeader>
          <CardContent>
            {payRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pay runs yet.</p>
            ) : (
              <ul className="space-y-2">
                {payRuns.map((payRun) => (
                  <li
                    key={payRun.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{payRun.reference}</p>
                      <p className="text-muted-foreground">{payRun.payPeriod}</p>
                    </div>
                    <Badge variant="outline">{payRun.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assigned employees</CardTitle>
            <CardDescription>
              Select employees who belong to this project
            </CardDescription>
          </div>
          <Button
            onClick={saveEmployees}
            disabled={setEmployeesMutation.isPending || assignedLoading}
          >
            Save employees
          </Button>
        </CardHeader>
        <CardContent>
          {assignedLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : allEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No employees available. Add employees first.
            </p>
          ) : (
            <ul className="space-y-2">
              {allEmployees.map((employee) => (
                <li
                  key={employee.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={selectedIds.has(employee.id)}
                    onCheckedChange={(checked) =>
                      toggleEmployee(employee.id, checked === true)
                    }
                  />
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.email}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
