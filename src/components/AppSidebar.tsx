import {
  MessageSquare,
  FolderClock,
  Settings,
  Scale,
  FileText,
  BarChart3,
  ShieldCheck,
  Users,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const baseNavItems = [
  { title: "Analisi", url: "/", icon: MessageSquare },
  { title: "Storico", url: "/storico", icon: FolderClock },
  { title: "Modelli", url: "/modelli", icon: FileText },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Privacy", url: "/privacy", icon: ShieldCheck },
  { title: "Impostazioni", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const navItems = isAdmin
    ? [
        ...baseNavItems.slice(0, 4),
        { title: "Clienti", url: "/clienti", icon: Users },
        ...baseNavItems.slice(4),
      ]
    : baseNavItems;

  const isActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  const handleLogout = () => {
    logout();
    toast.success("Logout effettuato");
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold text-sidebar-foreground leading-tight">
                IUSTA
              </h2>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Infortunistica Stradale
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigazione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        {user && !collapsed && (
          <div className="px-2 py-1.5 text-[11px] text-muted-foreground truncate">
            <span className="font-semibold text-foreground">
              {user.studio || user.username}
            </span>
            {isAdmin && (
              <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold uppercase tracking-wider">
                Admin
              </span>
            )}
          </div>
        )}
        <ThemeToggle collapsed={collapsed} />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-red-500 transition-colors"
          title="Esci"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
