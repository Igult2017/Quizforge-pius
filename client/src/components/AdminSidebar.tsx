import {
  LayoutDashboard,
  Users,
  Mail,
  Settings,
  LogOut,
} from "lucide-react";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Marketing",
    url: "/admin/marketing",
    icon: Mail,
  },
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();

  const handleNavigation = (url: string) => {
    console.log('Navigating to:', url);
    setLocation(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">NB</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold">NurseBrace</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    type="button"
                    isActive={location === item.url}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNavigation(item.url);
                    }}
                    data-testid={`link-admin-${item.title.toLowerCase()}`}
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
      <SidebarFooter className="border-t p-4">
        <SidebarMenuButton 
          type="button"
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNavigation("/");
          }}
          data-testid="link-exit-admin"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Admin</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
