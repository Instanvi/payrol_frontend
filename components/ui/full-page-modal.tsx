"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

interface FullPageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  contentClassName?: string
}

function FullPageModal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  contentClassName,
}: FullPageModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-sm",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 flex flex-col bg-background outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4 data-open:duration-200",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-4 data-closed:duration-150",
            "sm:inset-2 sm:rounded-none sm:border-2 sm:border-border sm:shadow-2xl",
            "md:inset-4 lg:inset-8",
            className
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-4 sm:px-6">
            <DialogPrimitive.Title className="pr-8 text-xl font-semibold tracking-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              <div className={cn("mx-auto w-full max-w-3xl", contentClassName)}>
                {children}
              </div>
            </div>
            {footer && (
              <footer className="shrink-0 border-t bg-muted/30 px-6 py-4">
                <div className="mx-auto flex w-full max-w-3xl justify-end gap-2">
                  {footer}
                </div>
              </footer>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface ConfirmFullPageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  destructive?: boolean
  loading?: boolean
}

function ConfirmFullPageModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
  loading = false,
}: ConfirmFullPageModalProps) {
  return (
    <FullPageModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      contentClassName="max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{description}</p>
    </FullPageModal>
  )
}

export { FullPageModal, ConfirmFullPageModal }
