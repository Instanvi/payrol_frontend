import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { DashboardGlobalModals } from "@/components/dashboard-global-modals";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider className="min-h-svh bg-main-bg">
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-x-hidden border-l border-black/4 bg-main-bg" data-dashboard>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-black/6 bg-white sm:h-16">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:px-3">
              <SidebarTrigger className="-ml-1 size-10 shrink-0 sm:size-8" />
              <Separator
                orientation="vertical"
                className="mr-2 hidden data-vertical:h-4 data-vertical:self-auto sm:block"
              />
              <div className="min-w-0 flex-1 truncate">
                <DashboardBreadcrumb />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-2.5 pt-3 sm:p-3 sm:pt-0">
            {children}
          </div>
          <DashboardGlobalModals />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
