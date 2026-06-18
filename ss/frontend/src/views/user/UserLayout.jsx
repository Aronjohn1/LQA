import React, { useContext, useState, useEffect } from "react";
import { NavLink, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FaUser, FaClipboardList, FaFileAlt, FaTimes, FaBars, FaSignOutAlt, FaHome } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import Profile from "./Profile";
import AttendanceHistory from "./AttendanceHistory";
import logo from '../../assets/logocc.jpg';
import Request from "./Requests";
import api, { API_BASE_URL } from "../../services/api";
function UserLayout() {
  const {
    user,
    logout
  } = useContext(AuthContext);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  useEffect(() => {
    const handleProfileUpdate = event => {
      if (event.detail?.profile_image) {
        setProfileImage(event.detail.profile_image);
      }
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    const fetchProfileImage = async () => {
      try {
        const res = await api.get("/user/profile");
        const data = res.data;
        if (data.profile_image) {
          const imageUrl = data.profile_image.startsWith('http') ? data.profile_image : `${API_BASE_URL}/uploads/profile/${data.profile_image}`;
          setProfileImage(imageUrl);
        }
      } catch (err) {
        console.error("Error fetching profile image:", err);
      }
    };
    fetchProfileImage();
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);
  const menuItems = [];
  const userRole = user?.role || localStorage.getItem('role');
  const userId = user?.id || user?.i_id || user?.t_id || user?.c_id || user?.s_id || user?.j_id || user?.e_id;
  const isInstructorTeacherPattern = userId && /^23-G-\d+$/.test(userId);
  console.log("User Layout Debug:", {
    userRole,
    userId,
    isInstructorTeacherPattern,
    userData: user
  });
  if (["G", "S", "J", "E"].includes(userRole)) {
    if (!isInstructorTeacherPattern) {
      menuItems.push({
        name: "Attendance",
        icon: FaClipboardList,
        path: "/user/attendance"
      }, {
        name: "Requests",
        icon: FaFileAlt,
        path: "/user/request"
      }, {
        name: "Profile",
        icon: FaUser,
        path: "/user/profile"
      });
    }
  }
  if (["T", "I"].includes(userRole) || isInstructorTeacherPattern) {
    menuItems.push({
      name: "Attendance",
      icon: FaClipboardList,
      path: "/user/attendance"
    }, {
      name: "Requests",
      icon: FaFileAlt,
      path: "/user/request"
    }, {
      name: "Profile",
      icon: FaUser,
      path: "/user/profile"
    });
  }
  if (menuItems.length === 0) {
    menuItems.push({
      name: "Profile",
      icon: FaUser,
      path: "/user/profile"
    });
  }
  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  useEffect(() => {
    const handleClickOutside = e => {
      if (isMobile && sidebarOpen && !e.target.closest('aside') && !e.target.closest('button')) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, sidebarOpen]);
  const getSidebarWidth = () => {
    return sidebarOpen ? "280px" : "0";
  };
  return <div className="flex min-h-[100vh] bg-[#f5f5f5] relative [overflow-x:hidden]">


      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.5)] [z-index:999] [transition:opacity_0.3s_ease]" />}


      <aside style={{
      width: getSidebarWidth(),
      background: "white",
      color: "#333",
      display: "flex",
      flexDirection: "column",
      padding: sidebarOpen ? "20px" : "0",
      boxShadow: sidebarOpen ? isMobile ? "2px 0 15px rgba(0,0,0,0.1)" : "2px 0 10px rgba(0,0,0,0.1)" : "none",
      transition: "width 0.3s ease, padding 0.3s ease",
      overflow: sidebarOpen ? "visible" : "hidden",
      borderRight: sidebarOpen ? "1px solid #e0e0e0" : "none",
      position: "fixed",
      height: "100vh",
      zIndex: 1000,
      left: 0,
      top: 0,
      visibility: sidebarOpen ? "visible" : "hidden",
      opacity: sidebarOpen ? 1 : 0
    }}>

        {sidebarOpen && <button onClick={toggleSidebar} className="absolute [top:1px] [right:5px] bg-white text-black border-0 text-[24px] flex">
            <FaTimes />
          </button>}

   
        <div className="text-center mb-[30px] mt-[30px] p-[0_10px]">
          <div className="w-[80px] h-[80px] rounded-full bg-[#f0f0f0] flex items-center justify-center m-[0_auto_15px] text-[30px] text-[#666] overflow-hidden [border:3px_solid_#0b7a3a]">
            {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-[100%] object-cover" /> : <FaUser />}
          </div>
          <h3 className="m-[0_0_5px_0] text-[16px] font-[bold] text-[#333] [line-height:1.3] [word-break:break-word]">
            {user?.name || "User"}
          </h3>
          <p className="m-0 text-[12px] text-[#666] [font-family:monospace]">
            ID: {userId || "N/A"}
          </p>
          <p className="m-[5px_0_0_0] text-[12px] text-[#0b7a3a] font-medium">
            {userRole === "G" ? "College Student" : userRole === "S" ? "Senior High" : userRole === "J" ? "Junior High" : userRole === "E" ? "Elementary" : userRole === "T" ? "Teacher" : userRole === "I" ? "Instructor" : "User"}
          </p>
        </div>


        <nav className="[flex:1] flex flex-col [gap:5px] p-[0_10px] overflow-y-auto max-h-[calc(100vh_-_300px)]">
          {menuItems.map(item => <NavLink key={item.path} to={item.path} onClick={() => isMobile && setSidebarOpen(false)} style={({
          isActive
        }) => ({
          display: "flex",
          alignItems: "center",
          padding: "15px 20px",
          textDecoration: "none",
          color: isActive ? "white" : "#333",
          background: isActive ? "#0b7a3a" : "transparent",
          fontWeight: isActive ? "600" : "500",
          transition: "all 0.2s ease",
          borderRadius: "8px",
          fontSize: "15px",
          border: isActive ? "none" : "1px solid #e0e0e0",
          marginBottom: "5px"
        })}>
              <item.icon className="mr-[12px] text-[16px] min-w-[20px]" />
              <span className="whitespace-nowrap overflow-hidden [text-overflow:ellipsis]">
                {item.name}
              </span>
            </NavLink>)}
        </nav>

     
        <div className="p-[10px] mt-[auto] [border-top:1px_solid_#e0e0e0]">
          <button onClick={() => setShowLogoutModal(true)} onMouseEnter={e => {
          e.currentTarget.style.background = "#dc3545";
          e.currentTarget.style.color = "white";
        }} onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#dc3545";
        }} className="w-full p-[15px] border-0 bg-[transparent] text-[#dc3545] cursor-pointer text-[15px] font-semibold [transition:all_0.2s_ease] flex items-center justify-center [gap:10px] rounded-[8px] [border:1px_solid_#dc3545]">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>


      <main style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      marginLeft: sidebarOpen ? isMobile ? "0" : "280px" : "0",
      transition: "margin-left 0.3s ease",
      width: "100%",
      minHeight: "100vh",
      overflow: "hidden",
      position: "relative"
    }}>
  
        <header className="bg-white p-[15px_20px] [border-bottom:1px_solid_#e0e0e0] flex items-center justify-between [box-shadow:0_2px_4px_rgba(0,0,0,0.05)] [position:sticky] [top:0] [z-index:100]">
          <div className="flex items-center [gap:15px] [flex:1]">

          <button onClick={toggleSidebar} onMouseEnter={e => {
            e.currentTarget.style.color = "#085d2c";
            e.currentTarget.style.transform = "scale(1.1)";
          }} onMouseLeave={e => {
            e.currentTarget.style.color = "#0b7a3a";
            e.currentTarget.style.transform = "scale(1)";
          }} className="bg-[transparent] border-0 text-[#0b7a3a] text-[24px] cursor-pointer p-[8px] flex items-center justify-center [transition:all_0.2s_ease]">
              <FaBars />
            </button>
            
            <div className="flex items-center [gap:12px]">
     
              <img src={logo} alt="GCC Logo" onError={e => {
              e.target.style.display = 'none';
              const fallback = document.getElementById('logo-fallback');
              if (fallback) fallback.style.display = 'flex';
            }} className="w-[32px] h-[32px] rounded-[6px] object-cover [border:1px_solid_#e0e0e0]" />
        
              <div id="logo-fallback" className="w-[32px] h-[32px] rounded-[6px] bg-[#0b7a3a] text-white hidden items-center justify-center font-[bold] text-[14px]">
                GCC
              </div>
              
              <h1 className="m-0 text-[20px] font-semibold text-[#0b7a3a] whitespace-nowrap overflow-hidden [text-overflow:ellipsis] [font-family:sans-serif]">
               LQA
              </h1>
            </div>
          </div>
          

          <div className="flex items-center [gap:8px] text-[14px] text-[#666] [flex-shrink:0]">
            <FaHome className="text-[12px]" />
            <span>
              {location.pathname === "/user/attendance" ? "Attendance" : location.pathname === "/user/request" ? "Requests" : location.pathname === "/user/profile" ? "Profile" : "Dashboard"}
            </span>
          </div>
        </header>

   
        <div className="[flex:1] p-[20px] overflow-y-auto [overflow-x:hidden]">
          <Routes>
            <Route index element={<Navigate to="/user/attendance" replace />} />
            <Route path="profile" element={<Profile />} />
            <Route path="attendance" element={<AttendanceHistory />} />
            <Route path="request" element={<Request />} />
          </Routes>
        </div>
      </main>


      {showLogoutModal && <div className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.5)] flex items-center justify-center [z-index:2000] p-[20px]">
          <div className="bg-white p-[25px] rounded-[12px] max-w-[400px] w-[90%] text-center relative [box-shadow:0_10px_30px_rgba(0,0,0,0.2)]">
            <button onClick={() => setShowLogoutModal(false)} onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f0f0f0"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"} className="absolute [top:10px] [right:10px] bg-[transparent] border-0 text-[20px] cursor-pointer text-[#666] w-[30px] h-[30px] flex items-center justify-center rounded-full [transition:background-color_0.2s]">
              ×
            </button>
            <h3 className="mb-[20px] text-[#333] text-[18px] font-semibold">
          
            </h3>
            <p className="mb-[25px] text-[#666] text-[14px]">
              Are you sure you want to logout?
            </p>
            <div className="flex [gap:10px] justify-center">
              <button onClick={() => setShowLogoutModal(false)} onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#0b7a3a";
            e.currentTarget.style.color = "#0b7a3a";
          }} onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#ddd";
            e.currentTarget.style.color = "#333";
          }} className="p-[10px_25px] [border:1px_solid_#ddd] bg-white rounded-[6px] cursor-pointer text-[14px] text-[#333] font-medium [transition:all_0.2s_ease] [flex:1]">
                Cancel
              </button>
              <button onClick={handleLogout} onMouseEnter={e => {
            e.currentTarget.style.background = "#c82333";
          }} onMouseLeave={e => {
            e.currentTarget.style.background = "#dc3545";
          }} className="p-[10px_25px] border-0 bg-[#dc3545] text-white rounded-[6px] cursor-pointer text-[14px] font-medium [transition:all_0.2s_ease] [flex:1]">
                Logout
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
export default UserLayout;
