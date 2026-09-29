import { Href } from "expo-router";
import {
  Box,
  Calendar,
  ChartSpline,
  FileOutput,
  LucideIcon,
  Palette,
  Settings,
  ShoppingCart,
  Store,
  UsersIcon,
  UserStar,
} from "lucide-react-native";
import { create } from "zustand";

export type DrawerItem = {
  id: string;
  name: string;
  route: Href;
  icon: LucideIcon;
};

interface DrawerState {
  items: DrawerItem[];
}

const drawerItems: DrawerItem[] = [
  {
    id: "1",
    name: "Dashboard Overview",
    route: "/(tabs)/Dashboard",
    icon: Store,
  },
  {
    id: "2",
    name: "Clients Management",
    route: "/(tabs)/Clients",
    icon: UsersIcon,
  },
  {
    id: "3",
    name: "Inventory",
    route: "/(tabs)/Inventory",
    icon: Box,
  },
  {
    id: "4",
    name: "Designs",
    route: "/Designs",
    icon: Palette,
  },
  {
    id: "5",
    name: "Order Management",
    route: "/(tabs)/Orders",
    icon: ShoppingCart,
  },
  {
    id: "6",
    name: "Invoice",
    route: "/(tabs)/Invoices",
    icon: FileOutput,
  },
  {
    id: "7",
    name: "Appointments",
    route: "/(tabs)/Appointments",
    icon: Calendar,
  },
  {
    id: "8",
    name: "Finances",
    route: "/(tabs)/Finance",
    icon: ChartSpline,
  },
  {
    id: "9",
    name: "CRM",
    route: "/(tabs)/CRM",
    icon: UserStar,
  },
  {
    id: "10",
    name: "More Settings",
    route: "/(tabs)/More",
    icon: Settings,
  },
  // {
  //   id: "11",
  //   name: "Plans & Billings",
  //   route: "/protected/PlansBillings",
  //   icon: Receipt,
  // },
];

export const useDrawerStore = create<DrawerState>(() => ({
  items: drawerItems,
}));
