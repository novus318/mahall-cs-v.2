"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  Building2,
  FileText,
  User,
  Wallet,
  SquareTerminal,
  MessageCircle,
  Heart,
  Settings2
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
          title: "Payments",
          url: "/dashboard/payments",
        },
        {
          title: "Receipts (Income)",
          url: "/dashboard/receipts",
        },
        {
          title: "Collections (Dues)",
          url: "/dashboard/collections",
        },
        {
          title: "Rent Collections",
          url: "/dashboard/rent/collections",
        },
        {
          title: "Transactions",
          url: "/dashboard/transactions",
        },
        {
          title: "Payables (Loans)",
          url: "/dashboard/payables",
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
        {
          title: "Nikah Register",
          url: "/dashboard/nikah-registers",
        },
        {
          title: "Death Register",
          url: "/dashboard/death-registers",
          icon: Heart
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
      title: "WhatsApp Inbox",
      url: "/dashboard/whatsapp",
      icon: MessageCircle,
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
              <a href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img src="/logo-white.png" alt="TMJ" className="size-6 rounded" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Mahall Management</span>
                  <span className="truncate text-xs">TMJ Committee</span>
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
