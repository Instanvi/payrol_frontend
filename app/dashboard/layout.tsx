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
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-gray-100" data-dashboard>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 bg-dashboard-canvas/95 backdrop-blur supports-backdrop-filter:bg-dashboard-canvas/90 sm:h-16">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-4">
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
          <div className="flex flex-1 flex-col gap-4 p-3 pt-4 sm:p-4 sm:pt-0">
            {children}
          </div>
          <DashboardGlobalModals />
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
