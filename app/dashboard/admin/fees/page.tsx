"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { adminService } from "@/lib/services/admin.service"
import { ApiError } from "@/lib/types"

export default function AdminChargesPage() {
  const queryClient = useQueryClient()
  const [newCharge, setNewCharge] = React.useState({
    name: "",
    fixedFee: "50",
    percentFee: "1.5",
    minFee: "50",
    maxFee: "5000",
  })

  const chargesQuery = useQuery({
    queryKey: ["admin", "charges"],
    queryFn: () => adminService.listCharges(),
  })

  const createChargeMutation = useMutation({
    mutationFn: () =>
      adminService.createCharge({
        name: newCharge.name,
        fixedFee: Number(newCharge.fixedFee),
        percentFee: Number(newCharge.percentFee),
        minFee: Number(newCharge.minFee),
        maxFee: Number(newCharge.maxFee),
        currency: "XAF",
      }),
    onSuccess: () => {
      toast.success("Charge created")
      setNewCharge({
        name: "",
        fixedFee: "50",
        percentFee: "1.5",
        minFee: "50",
        maxFee: "5000",
      })
      void queryClient.invalidateQueries({ queryKey: ["admin", "charges"] })
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to create charge"),
  })

  const charges = chargesQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform charges</CardTitle>
        <CardDescription>
          Define how much the platform cuts on each mobile money disbursement
          (fixed fee + percentage). Assign charges when approving companies.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="grid gap-2 sm:grid-cols-2">
          {charges.map((charge) => (
            <li key={charge.id} className="rounded-xl bg-card p-3 text-sm">
              <p className="font-medium">
                {charge.name}
                {charge.isDefault && (
                  <Badge className="ml-2" variant="secondary">
                    Default
                  </Badge>
                )}
              </p>
              <p className="text-muted-foreground">
                {charge.fixedFee} {charge.currency} + {charge.percentFee}%
                {charge.minFee != null && ` (min ${charge.minFee})`}
                {charge.maxFee != null && ` (max ${charge.maxFee})`}
              </p>
            </li>
          ))}
        </ul>

        <div className="space-y-3 rounded-xl bg-card p-4">
          <p className="text-sm font-medium">Create new charge</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Charge name"
              value={newCharge.name}
              onChange={(e) =>
                setNewCharge((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Input
              placeholder="Fixed fee (XAF)"
              value={newCharge.fixedFee}
              onChange={(e) =>
                setNewCharge((p) => ({ ...p, fixedFee: e.target.value }))
              }
            />
            <Input
              placeholder="Percent %"
              value={newCharge.percentFee}
              onChange={(e) =>
                setNewCharge((p) => ({ ...p, percentFee: e.target.value }))
              }
            />
            <Input
              placeholder="Min fee"
              value={newCharge.minFee}
              onChange={(e) =>
                setNewCharge((p) => ({ ...p, minFee: e.target.value }))
              }
            />
            <Button
              onClick={() => createChargeMutation.mutate()}
              disabled={!newCharge.name || createChargeMutation.isPending}
            >
              Add charge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
