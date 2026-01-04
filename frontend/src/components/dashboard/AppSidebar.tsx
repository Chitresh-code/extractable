import * as React from "react";
import { Home, FileText, GalleryVerticalEnd, UserCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { NavMain } from "../nav-main";
import { NavUser } from "../nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { useAuth } from "../../context/AuthContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Extractions",
      url: "/dashboard/extractions",
      icon: FileText,
    },
    {
      title: "Account",
      url: "/dashboard/account",
      icon: UserCircle,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard">
                <GalleryVerticalEnd className="h-5 w-5" />
                <span className="text-base font-semibold">Extractable</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navItems.map((item) => {
            // For Home, only match exact path or if it's the base dashboard
            // For Extractions, match the path or any sub-path
            let isActive = false;
            if (item.url === "/dashboard") {
              isActive = location.pathname === "/dashboard";
            } else {
              isActive =
                location.pathname === item.url ||
                location.pathname.startsWith(item.url + "/");
            }
            return {
              ...item,
              isActive,
            };
          })}
        />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              name: user.email.split("@")[0],
              email: user.email,
              avatar: "",
            }}
            onLogout={handleLogout}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
