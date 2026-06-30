"use client"

import * as React from "react"
import { Suspense } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { DataTableRowActions } from "@/components/data-table/data-table-row-actions"
import { ServerColumnHeader } from "@/components/data-table/server-column-header"
import { ServerDataTable } from "@/components/data-table/server-data-table"
import { MemberAddForm } from "@/components/forms/member-add-form"
import { MemberInviteForm } from "@/components/forms/member-invite-form"
import { PageHeader } from "@/components/page-header"
import { PermissionGate } from "@/components/permission-gate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ConfirmFullPageModal,
  FullPageModal,
} from "@/components/ui/full-page-modal"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAddMemberMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
  useResendMemberInviteMutation,
  useUpdateMemberRoleMutation,
} from "@/hooks/mutations/use-member-mutations"
import { useModalParam } from "@/hooks/use-modal-param"
import { useListParams } from "@/hooks/use-list-params"
import { useMembersQuery } from "@/hooks/queries/use-members-query"
import { ROLE_LABELS } from "@/lib/permissions"
import {
  memberRoleSchema,
  type MemberRoleFormValues,
} from "@/lib/validations/member.schema"
import type { CompanyMember, Role } from "@/lib/types"
import { PlusIcon, UserPlusIcon } from "lucide-react"

function MembersPageContent() {
  const modal = useModalParam()
  const { params, setParams } = useListParams({ sortBy: "name", sortOrder: "asc" })
  const { data, isLoading, isFetching } = useMembersQuery(params)
  const removeMutation = useRemoveMemberMutation()
  const resendMutation = useResendMemberInviteMutation()
  const [removeId, setRemoveId] = React.useState<string | null>(null)

  const members = data?.data ?? []
  const meta = data?.meta
  const editMember = modal.isOpen("edit-role") && modal.id
    ? members.find((m) => m.id === modal.id)
    : null

  const openEditRole = React.useCallback(
    (id: string) => modal.open("edit-role", id),
    [modal]
  )

  const columns: ColumnDef<CompanyMember>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Name"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "email",
        id: "email",
        header: ({ column }) => (
          <ServerColumnHeader
            column={column}
            title="Email"
            sortBy={params.sortBy}
            sortOrder={params.sortOrder}
            onSortChange={(sortBy, sortOrder) =>
              setParams({ sortBy, sortOrder, page: 1 })
            }
          />
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline">{ROLE_LABELS[row.original.role]}</Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "active" ? "default" : "secondary"}
          >
            {row.original.status}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <PermissionGate permission="members:write">
            <DataTableRowActions
              actions={[
                {
                  label: "Resend invite",
                  disabled:
                    row.original.role === "owner" ||
                    row.original.status !== "invited",
                  onClick: () => resendMutation.mutate(row.original.id),
                },
                {
                  label: "Change role",
                  disabled: row.original.role === "owner",
                  onClick: () => openEditRole(row.original.id),
                },
                {
                  label: "Remove",
                  destructive: true,
                  disabled: row.original.role === "owner",
                  onClick: () => setRemoveId(row.original.id),
                },
              ]}
            />
          </PermissionGate>
        ),
      },
    ],
    [openEditRole, params.sortBy, params.sortOrder, resendMutation, setParams]
  )

  const removeTarget = members.find((m) => m.id === removeId)

  async function handleRemove() {
    if (!removeId) return
    await removeMutation.mutateAsync(removeId)
    toast.success("Member removed")
    setRemoveId(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Members"
        description="Manage who can access payroll for your company"
      />

      <ServerDataTable
        columns={columns}
        data={members}
        meta={meta}
        params={params}
        onParamsChange={setParams}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search members..."
        toolbarActions={
          <PermissionGate permission="members:write">
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => modal.open("add")}
              >
                <UserPlusIcon />
                Add member
              </Button>
              <Button size="sm" onClick={() => modal.open("invite")}>
                <PlusIcon />
                Invite member
              </Button>
            </>
          </PermissionGate>
        }
        filters={[
          {
            key: "role",
            title: "Role",
            options: [
              { label: "Admin", value: "admin" },
              { label: "Manager", value: "manager" },
              { label: "Viewer", value: "viewer" },
            ],
          },
          {
            key: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Invited", value: "invited" },
            ],
          },
        ]}
      />

      <FullPageModal
        open={modal.isOpen("add")}
        onOpenChange={(open) => !open && modal.close()}
        title="Add team member"
      >
        <MemberAddFormWrapper
          onSuccess={() => {
            modal.close()
            toast.success("Member added")
          }}
        />
      </FullPageModal>

      <FullPageModal
        open={modal.isOpen("invite")}
        onOpenChange={(open) => !open && modal.close()}
        title="Invite team member"
      >
        <MemberInviteFormWrapper
          onSuccess={() => {
            modal.close()
            toast.success("Invitation sent")
          }}
        />
      </FullPageModal>

      <FullPageModal
        open={modal.isOpen("edit-role")}
        onOpenChange={(open) => !open && modal.close()}
        title="Change role"
      >
        {editMember && (
          <MemberRoleForm
            key={editMember.id}
            member={editMember}
            onSuccess={() => {
              modal.close()
              toast.success("Role updated")
            }}
            onCancel={modal.close}
          />
        )}
      </FullPageModal>

      <ConfirmFullPageModal
        open={!!removeId}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Remove member?"
        description={
          removeTarget
            ? `${removeTarget.name} will lose access to the company payroll workspace.`
            : "This member will lose access to the company workspace."
        }
        confirmLabel="Remove"
        destructive
        loading={removeMutation.isPending}
        onConfirm={handleRemove}
      />
    </div>
  )
}

function MemberAddFormWrapper({ onSuccess }: { onSuccess: () => void }) {
  const addMutation = useAddMemberMutation()

  return (
    <MemberAddForm
      isSubmitting={addMutation.isPending}
      onSubmit={async (values) => {
        await addMutation.mutateAsync(values)
        onSuccess()
      }}
    />
  )
}

function MemberInviteFormWrapper({ onSuccess }: { onSuccess: () => void }) {
  const inviteMutation = useInviteMemberMutation()

  return (
    <MemberInviteForm
      isSubmitting={inviteMutation.isPending}
      onSubmit={async (values) => {
        await inviteMutation.mutateAsync(values)
        onSuccess()
      }}
    />
  )
}

function MemberRoleForm({
  member,
  onSuccess,
  onCancel,
}: {
  member: CompanyMember
  onSuccess: () => void
  onCancel: () => void
}) {
  const updateMutation = useUpdateMemberRoleMutation()

  const form = useForm<MemberRoleFormValues>({
    resolver: zodResolver(memberRoleSchema),
    defaultValues: { role: member.role as "admin" | "manager" | "viewer" },
  })

  async function onSubmit(values: MemberRoleFormValues) {
    await updateMutation.mutateAsync({
      id: member.id,
      role: values.role as Role,
    })
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(["admin", "manager", "viewer"] as const).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default function MembersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <MembersPageContent />
    </Suspense>
  )
}
