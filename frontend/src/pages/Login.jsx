import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuthStore } from "../store/authStore";
import PasswordInput from "../components/PasswordInput";
import Modal from "../components/Modal";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(null); // { title, message }
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login/", { username, password });
      login(res.data.access, res.data.refresh);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setErrorModal({
          title: "Login Failed",
          message: "The username or password you entered is incorrect. Please check your credentials and try again.",
        });
      } else if (!err.response) {
        setErrorModal({
          title: "Connection Problem",
          message: "We couldn't reach the server. Check your internet connection and try again.",
        });
      } else {
        setErrorModal({
          title: "Something Went Wrong",
          message: "We couldn't log you in right now. Please try again in a moment.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">SAFI Farm</h1>

        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          autoComplete="username"
          required
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <Modal open={!!errorModal} onClose={() => setErrorModal(null)}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">{errorModal?.title}</h2>
          <p className="text-sm text-gray-500 mb-6">{errorModal?.message}</p>
          <button
            onClick={() => setErrorModal(null)}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </Modal>
    </div>
  );
}