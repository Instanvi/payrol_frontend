import { api } from "@/lib/api/axios"
import type { Employee, Project } from "@/lib/types"

export const projectsService = {
  list(status?: "active" | "inactive") {
    return api
      .get<{ data: Project[] }>("/projects", {
        params: status ? { status } : undefined,
      })
      .then((res) => res.data.data)
  },

  get(id: string) {
    return api.get<Project>(`/projects/${id}`).then((res) => res.data)
  },

  create(input: { name: string; code?: string; description?: string }) {
    return api.post<Project>("/projects", input).then((res) => res.data)
  },

  update(
    id: string,
    input: {
      name?: string
      code?: string
      description?: string
      status?: "active" | "inactive"
    }
  ) {
    return api.patch<Project>(`/projects/${id}`, input).then((res) => res.data)
  },

  remove(id: string) {
    return api.delete(`/projects/${id}`)
  },

  listEmployees(id: string) {
    return api
      .get<{ data: Employee[] }>(`/projects/${id}/employees`)
      .then((res) => res.data.data)
  },

  setEmployees(id: string, employeeIds: string[]) {
    return api
      .put<{ data: Employee[] }>(`/projects/${id}/employees`, { employeeIds })
      .then((res) => res.data.data)
  },

  async exportPayroll(id: string) {
    const response = await api.get<Blob>(`/projects/${id}/export`, {
      responseType: "blob",
    })

    const disposition = response.headers["content-disposition"] as
      | string
      | undefined
    const filenameMatch = disposition?.match(/filename="([^"]+)"/)
    const filename = filenameMatch?.[1] ?? `project-payroll-${id}.xlsx`

    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
