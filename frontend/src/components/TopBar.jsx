import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function TopBar({ onMenuClick }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
      <button onClick={onMenuClick} className="md:hidden text-2xl text-gray-600">
        ☰
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2 md:gap-4">
        <span className="text-xs md:text-sm text-gray-600">
          {user?.username} <span className="text-gray-400 hidden sm:inline">({user?.role?.replace("_", " ")})</span>
        </span>
        <button
          onClick={handleLogout}
          className="text-xs md:text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}