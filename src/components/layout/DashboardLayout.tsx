
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardContent = ({ children }: DashboardLayoutProps) => {
  const context = useSidebar();
  const isCollapsed = context?.state === "collapsed";

  return (
    <div className={`flex-1 h-screen flex flex-col transition-[margin] duration-200 ${isCollapsed ? "ml-[70px]" : "ml-[290px]"}`}>
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto bg-background dark:bg-background">
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="h-screen flex w-full overflow-hidden overflow-x-hidden bg-background dark:bg-background">
      <SidebarProvider>
        <DashboardSidebar />
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
