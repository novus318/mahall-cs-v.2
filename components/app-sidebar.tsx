"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  LayoutDashboard,
  Package,
  Building2,
  FileText,
  User,
  Wallet,
  IndianRupee,
  Landmark
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Finances",
      url: "#",
      icon: Wallet,
      items: [
        {
          title: "Accounts",
          url: "/dashboard/accounts",
        },
        {
          title: "Transactions",
          url: "/dashboard/transactions",
        }
      ]
    },
    {
      title: "Family Management",
      url: "#",
      icon: SquareTerminal,
      items: [
        {
          title: "Families",
          url: "/dashboard/families",
        },
        {
          title: "Houses",
          url: "/dashboard/houses",
        },
        {
          title: "Members",
          url: "/dashboard/members",
        },
      ],
    },
    {
      title: "Property Management",
      url: "#",
      icon: Building2,
      items: [
        {
          title: "Inventory (Assets)",
          url: "/dashboard/inventory",
          icon: Package
        },
        {
          title: "Buildings & Rooms",
          url: "/dashboard/buildings",
          icon: Building2
        },
        {
          title: "Rental Contracts",
          url: "/dashboard/contracts",
          icon: FileText
        },
      ]
    },
    {
      title: "Staff Management",
      url: "#",
      icon: User,
      items: [
        {
          title: "Staff Directory",
          url: "/dashboard/staff",
          icon: User,
        }
      ]
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Mahall V2</span>
                  <span className="truncate text-xs">Management System</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
