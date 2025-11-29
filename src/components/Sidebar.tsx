import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Building2, 
  LayoutDashboard, 
  FileText, 
  Search, 
  LogOut, 
  ChevronLeft,
  Users,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isAdmin: boolean;
}

const Sidebar = ({ isAdmin }: SidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, admin: false },
    { title: "Lotes", url: "/lotes", icon: Building2, admin: false },
    { title: "Buscar", url: "/buscar", icon: Search, admin: false },
    { title: "Meus Dados", url: "/meus-dados", icon: UserCog, admin: false },
    { title: "Logs de Acesso", url: "/logs", icon: FileText, admin: true },
  ];

  const filteredItems = menuItems.filter(item => !item.admin || isAdmin);

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Gestão Lotes</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.url}>
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-muted",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3",
            collapsed && "justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
