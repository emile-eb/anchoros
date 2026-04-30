import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { getCommandPaletteData, getWorkspaceContext } from "@/lib/data/workspace";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [{ workspace, profile }, commandData] = await Promise.all([
    getWorkspaceContext(),
    getCommandPaletteData(),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f5f1] lg:flex">
      <AppSidebar workspaceName={workspace.name} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppHeader
          workspaceName={workspace.name}
          userEmail={profile.email}
          userName={profile.full_name}
          recentLeads={commandData.recentLeads}
          recentRoutes={commandData.recentRoutes}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
