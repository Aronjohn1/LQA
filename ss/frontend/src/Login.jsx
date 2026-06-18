import React, { useState, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import api from "./services/api";
import logo from "./assets/logocc.jpg";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ButtonSkeleton } from "./components/Skeleton";
export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
    login
  } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setError(null);
    if (!userId || !password) {
      setError("Please enter your ID and password");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        user_id: userId,
        password
      });
      login(res.data);
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] p-[1rem] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e8eef5]">
      <div className="w-full max-w-[480px]">
        {/* Card Container */}
        <div className="bg-white rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-r from-[#06a85a] to-[#0ae373] p-[2.5rem] text-center">
            <img 
              src={logo} 
              alt="LQA Logo" 
              className="w-[80px] h-[80px] object-contain mx-auto mb-[1.5rem] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-white p-[8px]" 
            />
            
            <h1 className="text-[2.2rem] font-bold text-white mb-[0.5rem] tracking-[-0.5px]">
              LQA System
            </h1>
            <p className="text-[0.95rem] text-[#c8e6d7] font-medium">
              Library QRCode Attendance
            </p>
          </div>

          {/* Form Section */}
          <div className="p-[2.5rem]">
            {/* Error Message */}
            {error && (
              <div className="mb-[1.5rem] p-[1rem] bg-[#fee2e2] border-l-[4px] border-[#dc2626] rounded-[8px] animate-pulse">
                <p className="text-[#991b1b] font-medium text-[0.95rem] flex items-center gap-[0.5rem]">
                  <span>⚠️</span> {error}
                </p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-[1.5rem]">
              {/* User ID Field */}
              <div>
                <label className="block mb-[0.75rem] font-semibold text-[#1e293b] text-[0.95rem]">
                  User ID
                </label>
                <div className="relative">
                  <input 
                    value={userId} 
                    onChange={e => setUserId(e.target.value)} 
                    placeholder="Enter your ID" 
                    required 
                    disabled={loading}
                    className="w-full px-[1rem] py-[0.875rem] bg-[#f8fafc] border-[2px] border-[#e2e8f0] rounded-[10px] text-[1rem] text-[#1e293b] placeholder-[#94a3b8] outline-none transition-all duration-200 focus:border-[#06a85a] focus:bg-white focus:shadow-[0_0_0_3px_rgba(6,168,90,0.1)] disabled:bg-[#f1f5f9] disabled:cursor-not-allowed" 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block mb-[0.75rem] font-semibold text-[#1e293b] text-[0.95rem]">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Enter your password" 
                    required 
                    disabled={loading}
                    className="w-full px-[1rem] py-[0.875rem] pr-[2.5rem] bg-[#f8fafc] border-[2px] border-[#e2e8f0] rounded-[10px] text-[1rem] text-[#1e293b] placeholder-[#94a3b8] outline-none transition-all duration-200 focus:border-[#06a85a] focus:bg-white focus:shadow-[0_0_0_3px_rgba(6,168,90,0.1)] disabled:bg-[#f1f5f9] disabled:cursor-not-allowed" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[1rem] top-[50%] transform translate-y-[-50%] text-[#64748b] hover:text-[#06a85a] transition-colors duration-200"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-[0.875rem] rounded-[10px] font-semibold text-[1rem] transition-all duration-300 transform ${
                  loading 
                    ? "bg-[#cbd5e1] text-[#64748b] cursor-not-allowed" 
                    : "bg-gradient-to-r from-[#06a85a] to-[#0ae373] text-white shadow-[0_4px_12px_rgba(6,168,90,0.3)] hover:shadow-[0_6px_20px_rgba(6,168,90,0.4)] hover:-translate-y-[2px] active:translate-y-[1px]"
                }`}
              >
                {loading ? <ButtonSkeleton label="Logging in..." /> : "Sign In"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-[2.5rem] py-[1.5rem] bg-[#f8fafc] border-t border-[#e2e8f0] text-center">
            <p className="text-[#64748b] text-[0.85rem]">
              Protected by institutional authentication
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <p className="text-center text-[#64748b] text-[0.85rem] mt-[1.5rem]">
          © 2025 Library QRCode Attendance
        </p>
      </div>
    </div>
  );
}
