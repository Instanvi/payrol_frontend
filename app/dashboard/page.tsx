"use client"

import { useSession } from "@/components/providers/session-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStatsQuery } from "@/hooks/queries/use-employees-query"
import { BanknoteIcon, UsersIcon, ClockIcon } from "lucide-react"

export default function DashboardPage() {
  const { session } = useSession()
  const { data: stats, isLoading } = useDashboardStatsQuery()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">Payroll dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user.name}. Run payroll and manage direct
          deposits for {session?.company.name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Employees on payroll
            </CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.employees ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeEmployees ?? 0} active for pay
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending pay runs
            </CardTitle>
            <ClockIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.pendingPayRuns ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Scheduled or awaiting approval
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending transactions
            </CardTitle>
            <BanknoteIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.pendingTransactions ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalTransactions ?? 0} total disbursements
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            A typical payroll cycle in this app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Add or import employees with direct deposit details</p>
          <p>2. Create a pay run — one payment transaction is generated per employee</p>
          <p>3. Review transactions and schedule direct deposit disbursements</p>
        </CardContent>
      </Card>
    </div>
  )
}
