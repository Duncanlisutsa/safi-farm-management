import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Planner from "./pages/Planner";
import Crops from "./pages/Crops";
import Tea from "./pages/Tea";
import Pigs from "./pages/Pigs";
import Poultry from "./pages/Poultry";
import Aquaculture from "./pages/Aquaculture";
import Factory from "./pages/Factory";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";


export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager"]}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planner"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager"]}>
              <AppLayout>
                <Planner />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/crops"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager", "farm_attendant"]}>
              <AppLayout>
                <Crops />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tea"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager"]}>
              <AppLayout>
                <Tea />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pigs"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager"]}>
              <AppLayout>
                <Pigs />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/poultry"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager", "farm_attendant"]}>
              <AppLayout>
                <Poultry />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fish"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager", "fish_attendant"]}>
              <AppLayout>
                <Aquaculture />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/factory"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager", "factory_worker"]}>
              <AppLayout>
                <Factory />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "executive", "farm_manager"]}>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppLayout>
                <UserManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}