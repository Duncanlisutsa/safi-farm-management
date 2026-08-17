import { NavLink } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin", "executive", "farm_manager"] },
  { to: "/employees", label: "Employee Records", roles: ["admin", "executive"] },
  { to: "/planner", label: "Work Planner", roles: ["admin", "farm_manager"] },
  { to: "/my-tasks", label: "My Tasks", roles: ["farm_attendant", "pig_attendant", "fish_attendant", "factory_worker"] },
  { to: "/crops", label: "Crops & Herbs", roles: ["admin", "executive", "farm_manager", "farm_attendant"] },
  { to: "/report-produce", label: "Report Produce", roles: ["farm_attendant"] },
  { to: "/orders/new", label: "Make an Order", roles: ["farm_attendant", "pig_attendant", "fish_attendant", "factory_worker"] },
  { to: "/tea", label: "Tea Management", roles: ["admin", "executive", "farm_manager"] },
  { to: "/pigs", label: "Pig Records", roles: ["admin", "executive", "farm_manager"] },
  { to: "/pig-report", label: "Report Pig Activity", roles: ["pig_attendant"] },
  { to: "/poultry", label: "Poultry", roles: ["admin", "executive", "farm_manager", "farm_attendant"] },
  { to: "/feed-request", label: "Request Feeds", roles: ["pig_attendant"] },
  { to: "/fish", label: "Aquaculture", roles: ["admin", "executive", "farm_manager"] },
  { to: "/pond-report", label: "Report Pond Activity", roles: ["fish_attendant"] },
  { to: "/factory", label: "Factory", roles: ["admin", "executive", "farm_manager", "factory_worker"] },
  { to: "/production-log", label: "Log Production", roles: ["factory_worker"] },
  { to: "/reports", label: "Production Reports", roles: ["admin", "executive", "farm_manager"] },
  { to: "/admin/users", label: "User Management", roles: ["admin", "farm_manager"] },
];

export default function Sidebar({ onNavigate }) {
  const role = useAuthStore((state) => state.user?.role);
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-green-900 text-white h-full min-h-screen p-4 flex flex-col overflow-y-auto">
      <h2 className="text-xl font-bold mb-8 px-2">SAFI Farm</h2>
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `px-3 py-2 rounded transition-colors ${
                isActive ? "bg-green-700 font-semibold" : "hover:bg-green-800"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}