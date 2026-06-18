import React, { useState, useEffect } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { FaUser, FaQrcode, FaTachometerAlt, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import Dashboard from "./Dashboard";
import ScanQRAttendance from "./ScanQRAttendance";
import Profile from "./Profile";
import api, { API_BASE_URL } from "../../services/api";
import logo from '../../assets/logocc.jpg';
function LibrarianLayout() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [user, setUser] = useState({
    user_name: "Librarian Staff",
    profile_image: null
  });
  useEffect(() => {
    fetchUserProfile();
  }, []);
  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      console.log("Fetched user profile:", res.data);
      let imageUrl = null;
      if (res.data.profile_image) {
        imageUrl = res.data.profile_image.startsWith('http') ? res.data.profile_image : `${API_BASE_URL}/uploads/profile/${res.data.profile_image}`;
      }
      setUser({
        user_name: res.data.user_name || res.data.name || "Librarian Staff",
        profile_image: imageUrl
      });
      if (res.data.user_name) localStorage.setItem("name", res.data.user_name);
      if (imageUrl) localStorage.setItem("profileImage", imageUrl);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      const storedName = localStorage.getItem("name");
      const storedImage = localStorage.getItem("profileImage");
      if (storedName || storedImage) {
        setUser({
          user_name: storedName || "Librarian Staff",
          profile_image: storedImage || null
        });
      }
    }
  };
  useEffect(() => {
    const handleProfileUpdate = event => {
      if (event.detail) {
        setUser(prev => ({
          ...prev,
          ...event.detail
        }));
        if (event.detail.user_name) localStorage.setItem("name", event.detail.user_name);
        if (event.detail.profile_image) localStorage.setItem("profileImage", event.detail.profile_image);
      }
    };
    const handleStorageChange = () => {
      const storedName = localStorage.getItem("name");
      const storedImage = localStorage.getItem("profileImage");
      setUser({
        user_name: storedName || "Librarian Staff",
        profile_image: storedImage || null
      });
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("profileImage");
    localStorage.removeItem("userId");
    navigate("/login");
  };
  return <div className="flex min-h-[100vh] bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside style={{
      width: 260,
      background: "white",
      boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0,
      left: showSidebar ? 0 : -260,
      height: "100vh",
      transition: "left 0.3s ease-in-out",
      zIndex: 1500,
      padding: 20,
      borderRight: "1px solid #ddd"
    }}>
        {/* Close button */}
        <FaTimes onClick={() => setShowSidebar(false)} className="absolute [top:15px] [right:15px] text-[20px] cursor-pointer text-[#000]" />

        {/* Profile Section */}
        <div className="text-center mt-[20px] mb-[20px]">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden m-[0_auto_10px] bg-[#f0f0f0] flex items-center justify-center [border:3px_solid_#0b7a3a]">
            {user.profile_image ? <img src={user.profile_image} alt="Profile" onError={e => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = '<div style="font-size: 35px; color: #0b7a3a;">👤</div>';
          }} className="w-full h-[100%] object-cover" /> : <FaUser className="text-[35px] text-[#0b7a3a]" />}
          </div>
          <div className="mt-[8px] font-semibold text-[#333] text-[16px]">
            {user.user_name}
          </div>
          <p className="text-[#0b7a3a] text-[14px] m-[5px_0_0_0] font-medium">
            Librarian Staff
          </p>
        </div>

        {/* Navigation */}
        <nav className="[flex:1] flex flex-col [gap:6px] p-[0_10px]">
          <NavLink to="/librarian/dashboard" onClick={() => setShowSidebar(false)} style={({
          isActive
        }) => ({
          display: "flex",
          alignItems: "center",
          padding: "15px 20px",
          textDecoration: "none",
          color: isActive ? "white" : "#333",
          background: isActive ? "#0b7a3a" : "transparent",
          transition: "all 0.2s",
          fontWeight: isActive ? 600 : 500,
          borderRadius: 8,
          border: isActive ? "none" : "1px solid #e0e0e0",
          fontSize: 15
        })}>
            <FaTachometerAlt className="mr-[12px] text-[16px]" />
            Dashboard
          </NavLink>

          <NavLink to="/librarian/scan" onClick={() => setShowSidebar(false)} style={({
          isActive
        }) => ({
          display: "flex",
          alignItems: "center",
          padding: "15px 20px",
          textDecoration: "none",
          color: isActive ? "white" : "#333",
          background: isActive ? "#0b7a3a" : "transparent",
          transition: "all 0.2s",
          fontWeight: isActive ? 600 : 500,
          borderRadius: 8,
          border: isActive ? "none" : "1px solid #e0e0e0",
          fontSize: 15
        })}>
            <FaQrcode className="mr-[12px] text-[16px]" />
            Scan QR Attendance
          </NavLink>

          <NavLink to="/librarian/profile" onClick={() => setShowSidebar(false)} style={({
          isActive
        }) => ({
          display: "flex",
          alignItems: "center",
          padding: "15px 20px",
          textDecoration: "none",
          color: isActive ? "white" : "#333",
          background: isActive ? "#0b7a3a" : "transparent",
          transition: "all 0.2s",
          fontWeight: isActive ? 600 : 500,
          borderRadius: 8,
          border: isActive ? "none" : "1px solid #e0e0e0",
          fontSize: 15
        })}>
            <FaUser className="mr-[12px] text-[16px]" />
            Profile
          </NavLink>
        </nav>

        {/* Logout Button */}
        <div className="p-[10px] mt-[auto] [border-top:1px_solid_#e0e0e0]">
          <button onClick={() => setShowLogoutModal(true)} onMouseEnter={e => {
          e.currentTarget.style.background = "#dc3545";
          e.currentTarget.style.color = "white";
        }} onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#dc3545";
        }} className="w-full p-[15px] [border:1px_solid_#dc3545] bg-[transparent] text-[#dc3545] cursor-pointer text-[15px] font-semibold [transition:all_0.2s_ease] flex items-center justify-center [gap:10px] rounded-[8px]">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
      flex: 1,
      marginLeft: showSidebar ? 260 : 0,
      transition: "margin-left 0.3s ease-in-out",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
        {/* Header */}
        <header className="bg-white p-[15px_20px] [border-bottom:1px_solid_#e0e0e0] [box-shadow:0_2px_4px_rgba(0,0,0,0.05)] flex items-center [gap:15px] [position:sticky] [top:0] [z-index:100]">
          {!showSidebar && <button onClick={() => setShowSidebar(true)} onMouseEnter={e => {
          e.currentTarget.style.color = "#085d2c";
          e.currentTarget.style.transform = "scale(1.1)";
        }} onMouseLeave={e => {
          e.currentTarget.style.color = "#0b7a3a";
          e.currentTarget.style.transform = "scale(1)";
        }} className="bg-[transparent] border-0 text-[#0b7a3a] text-[24px] cursor-pointer p-[8px] flex items-center justify-center [transition:all_0.2s_ease]">
              <FaBars />
            </button>}
          <img src={logo} alt="Logo" className="w-[36px] h-[36px] rounded-[6px] object-cover [border:1px_solid_#e0e0e0]" />
          <h1 className="m-0 text-[20px] text-[#0b7a3a] font-semibold [font-family:sans-serif]">
            LQA
          </h1>
        </header>

        {/* Page Content */}
        <div className="[flex:1] p-[24px] bg-[#f5f5f5] overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/librarian/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="scan" element={<ScanQRAttendance />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && <div className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.5)] flex items-center justify-center [z-index:2000] p-[20px]">
          <div className="bg-white p-[25px] rounded-[12px] max-w-[400px] w-[90%] text-center [box-shadow:0_10px_30px_rgba(0,0,0,0.2)] relative">
            {/* X Close Button */}
            <button onClick={() => setShowLogoutModal(false)} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f0f0"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} className="absolute [top:10px] [right:10px] bg-[transparent] border-0 text-[20px] cursor-pointer text-[#666] w-[30px] h-[30px] flex items-center justify-center rounded-full [transition:background-color_0.2s]">
              ×
            </button>
            

            <p className="m-[0_0_25px_0] text-[#666] text-[14px]">
              Are you sure you want to logout?
            </p>
            
            <div className="flex [gap:10px] justify-center">
              <button onClick={() => setShowLogoutModal(false)} onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#0b7a3a";
            e.currentTarget.style.color = "#0b7a3a";
          }} onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.color = "#333";
          }} className="p-[10px_25px] [border:1px_solid_#ddd] bg-white rounded-[6px] cursor-pointer text-[14px] font-medium text-[#333] [transition:all_0.2s] [flex:1]">
                Cancel
              </button>
              <button onClick={handleLogout} onMouseEnter={e => e.currentTarget.style.background = "#c82333"} onMouseLeave={e => e.currentTarget.style.background = "#dc3545"} className="p-[10px_25px] border-0 bg-[#dc3545] text-white rounded-[6px] cursor-pointer text-[14px] font-medium [transition:all_0.2s] [flex:1]">
                Logout
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
export default LibrarianLayout;
