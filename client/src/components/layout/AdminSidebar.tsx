import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  BookOpenText,
  Calendar,
  Award,
  BookOpen,
  Bell,
  BarChart3,
  GraduationCap,
  LogOut,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoWithFallback from "@/components/common/LogoWithFallback";

interface AdminSidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
  onLogout?: () => void;
  adminRole?: 'admin' | 'super_admin' | null;
  hasBranchContext?: boolean;
  showHiddenMenu?: boolean;
}

const fullMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "branch_home" },
  { title: "Students", icon: Users, id: "students" },
  { title: "Subjects", icon: BookOpenText, id: "subjects" },
  { title: "Attendance", icon: Calendar, id: "attendance" },
  { title: "Marks", icon: Award, id: "marks" },
  { title: "Library", icon: BookOpen, id: "library" },
  { title: "Notices", icon: Bell, id: "notices" },
  { title: "Reports", icon: BarChart3, id: "reports" },
];

export default function AdminSidebar({ activeItem = "dashboard", onNavigate, onLogout, adminRole, hasBranchContext = false, showHiddenMenu = false }: AdminSidebarProps) {
  const baseItems = [
    { title: "Dashboard", icon: GraduationCap, id: "dashboard" },
    { title: "Reports", icon: BarChart3, id: "reports" }
  ];
  const displayItems = hasBranchContext ? [...fullMenuItems] : baseItems;

  // Show "Admins" menu item only for super_admin
  if (adminRole === 'super_admin' && !hasBranchContext && showHiddenMenu) {
    // Insert Admins after Dashboard
    displayItems.splice(1, 0, { title: "Admins", icon: Shield, id: "admins" });
  }


  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <LogoWithFallback
            src="/logo.jpeg?v=1"
            alt="KNSGP College Logo"
            className="h-12.5 w-12.5 rounded-lg object-contain"
            width={50}
            height={50}
          />
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">KNSGP College</p>
            <p className="text-xs text-sidebar-foreground/60">
              {adminRole === 'super_admin' && showHiddenMenu ? 'Super Admin Panel' : 'Admin Panel'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeItem === item.id}
                    onClick={() => onNavigate?.(item.id)}
                    data-testid={`sidebar-${item.id}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
