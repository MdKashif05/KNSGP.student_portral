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
  BarChart3,
  GraduationCap,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
  onLogout?: () => void;
}

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Students", icon: Users, id: "students" },
  { title: "Subjects", icon: BookOpenText, id: "subjects" },
  { title: "Attendance", icon: Calendar, id: "attendance" },
  { title: "Marks", icon: Award, id: "marks" },
  { title: "Library", icon: BookOpen, id: "library" },
  { title: "Reports", icon: BarChart3, id: "reports" },
];

export default function AdminSidebar({ activeItem = "dashboard", onNavigate, onLogout }: AdminSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <img 
            src="/attached_assets/WhatsApp Image 2025-10-11 at 23.32.21_1760206203929.jpeg"
            alt="KNSGP College Logo"
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">CSE Portal</p>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
