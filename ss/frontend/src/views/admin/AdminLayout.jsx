import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import AttendanceRecords from './AttendanceRecords';
import UserManagement from './UserManagement';
import Report from "./Reports";
import AdminProfile from './Profile';
import ManageRequest from './ManageRequests';
import api, { API_BASE_URL } from '../../services/api';
import logo from '../../assets/logocc.jpg';
import { FaTachometerAlt, FaUsers, FaClipboardList, FaFileAlt, FaUser, FaBars, FaTimes, FaFile, FaSignOutAlt } from 'react-icons/fa';
const getProfileImageUrl = imagePath => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}/uploads/profile/${imagePath}`;
};
export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.split('/')[2] || 'dashboard';
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'admin') return <Navigate to="/login" replace />;
  const updateUserProfile = useCallback(newUserData => {
    setUser(prevUser => {
      if (newUserData && typeof newUserData === 'object') {
        if (newUserData.profile_image) {
          newUserData.profile_image = getProfileImageUrl(newUserData.profile_image);
        }
        return {
          ...prevUser,
          ...newUserData
        };
      }
      return prevUser;
    });
  }, []);
  useEffect(() => {
    let mounted = true;
    api.get('/protected', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(res => {
      if (!mounted) return;
      const fetchedUser = res.data.user;
      if (fetchedUser.profile_image) {
        fetchedUser.profile_image = getProfileImageUrl(fetchedUser.profile_image);
      }
      setUser(fetchedUser);
    }).catch(err => {
      if (!mounted) return;
      setError(err?.response?.data?.message || err.message);
    });
    const handleProfileUpdate = event => {
      if (event.detail?.profile_image) {
        updateUserProfile({
          profile_image: event.detail.profile_image
        });
      }
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [token, updateUserProfile]);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login', {
      replace: true
    });
  };
  const confirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };
  return <div className="flex min-h-[100vh] bg-[#f5f5f5]">
      


      {/* Sidebar */}
      <aside style={{
      width: 260,
      background: '#fff',
      padding: 20,
      borderRight: '1px solid #ddd',
      position: 'fixed',
      top: 0,
      left: showSidebar ? 0 : -260,
      height: '100vh',
      transition: 'left 0.3s ease-in-out',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column'
    }}>
        {/* Close Button */}
        <button onClick={() => setShowSidebar(false)} className="absolute [top:15px] [right:15px] bg-[transparent] border-0 text-[20px] cursor-pointer text-[#000] p-[0] flex items-center justify-center">
          <FaTimes />
        </button>

        {/* Profile Section */}
        <div className="text-center mt-[20px] mb-[20px]">
          <div className="w-[80px] h-[80px] rounded-full overflow-hidden [border:3px_solid_#0b7a3a] m-[0_auto_10px]">
            {user?.profile_image ? <img src={user.profile_image} alt="Profile" className="w-full h-[100%] object-cover" /> : <div className="w-full h-[100%] bg-[#f0f0f0] flex items-center justify-center">
                <FaUser className="text-[30px] text-[#666]" />
              </div>}
          </div>
          <div className="mt-[8px] font-semibold text-[#333] text-[16px]">
            {user?.user_name || 'Admin Name'}
          </div>
          <h1 className="text-[#0b7a3a] text-[14px] m-[5px_0_0_0] font-medium">
            {role}
          </h1>
        </div>

    
        <nav className="[flex:1] flex flex-col [gap:8px] p-[0_10px] overflow-y-auto">
          <MenuItem icon={<FaTachometerAlt />} active={active === 'dashboard'} onClick={() => {
          navigate('/admin/dashboard');
          setShowSidebar(false);
        }}>
            Dashboard
          </MenuItem>
          <MenuItem icon={<FaUsers />} active={active === 'users'} onClick={() => {
          navigate('/admin/users');
          setShowSidebar(false);
        }}>
            User Management
          </MenuItem>
          <MenuItem icon={<FaClipboardList />} active={active === 'attendance'} onClick={() => {
          navigate('/admin/attendance');
          setShowSidebar(false);
        }}>
            Attendance Records
          </MenuItem>
          <MenuItem icon={<FaFileAlt />} active={active === 'request'} onClick={() => {
          navigate('/admin/request');
          setShowSidebar(false);
        }}>
            Manage Request
          </MenuItem>
          <MenuItem icon={<FaUser />} active={active === 'profile'} onClick={() => {
          navigate('/admin/profile');
          setShowSidebar(false);
        }}>
            Profile
          </MenuItem>
          <MenuItem icon={<FaFile />} active={active === 'report'} onClick={() => {
          navigate('/admin/report');
          setShowSidebar(false);
        }}>
            Report
          </MenuItem>
        </nav>

    
        <div className="p-[10px] mt-[auto] [border-top:1px_solid_#e0e0e0]">
          <button onClick={() => setShowLogoutModal(true)} onMouseEnter={e => {
          e.currentTarget.style.background = '#dc3545';
          e.currentTarget.style.color = 'white';
        }} onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#dc3545';
        }} className="w-full p-[15px] [border:1px_solid_#dc3545] bg-[transparent] text-[#dc3545] cursor-pointer text-[15px] font-semibold [transition:all_0.2s_ease] flex items-center justify-center [gap:10px] rounded-[8px]">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

 
      <div style={{
      flex: 1,
      marginLeft: showSidebar ? 280 : 0,
      transition: 'margin-left 0.3s ease-in-out',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
   
        <header className="flex items-center [gap:15px] p-[15px_20px] bg-[#fff] [border-bottom:1px_solid_#e0e0e0] [box-shadow:0_2px_4px_rgba(0,0,0,0.05)] [position:sticky] [top:0] [z-index:100]">
          {!showSidebar && <button onClick={() => setShowSidebar(true)} onMouseEnter={e => {
          e.currentTarget.style.color = '#085d2c';
          e.currentTarget.style.transform = 'scale(1.1)';
        }} onMouseLeave={e => {
          e.currentTarget.style.color = '#0b7a3a';
          e.currentTarget.style.transform = 'scale(1)';
        }} className="bg-[transparent] border-0 text-[#0b7a3a] text-[24px] cursor-pointer p-[8px] flex items-center justify-center [transition:all_0.2s_ease]">
              <FaBars />
            </button>}

          <img src={logo} alt="Logo" className="w-[36px] h-[36px] rounded-[6px] object-cover [border:1px_solid_#e0e0e0]" />
          <h1 className="m-0 text-[20px] font-semibold text-[#0b7a3a] whitespace-nowrap overflow-hidden [text-overflow:ellipsis] [font-family:sans-serif]">
           LQA 
          </h1>
        </header>

        
        <main className="[flex:1] p-[24px] bg-[#f5f5f5] overflow-y-auto">
          {error ? <div className="text-[red]">{error}</div> : <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="attendance" element={<AttendanceRecords />} />
              <Route path="request" element={<ManageRequest />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="report" element={<Report />} />
            </Routes>}
        </main>
      </div>

  
      {showLogoutModal && <div className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.5)] flex items-center justify-center [z-index:9999] p-[20px]">
          <div className="bg-white p-[25px] rounded-[12px] max-w-[400px] w-[90%] text-center relative [box-shadow:0_10px_30px_rgba(0,0,0,0.2)]">
            <button onClick={() => setShowLogoutModal(false)} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'} className="absolute [top:10px] [right:10px] bg-[transparent] border-0 text-[20px] cursor-pointer text-[#666] w-[30px] h-[30px] flex items-center justify-center rounded-full [transition:background-color_0.2s]">
              ×
            </button>

     
            <p className="mb-[25px] text-[#666] text-[14px]">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-center [gap:10px]">
              <button onClick={() => setShowLogoutModal(false)} onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#0b7a3a';
            e.currentTarget.style.color = '#0b7a3a';
          }} onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#ddd';
            e.currentTarget.style.color = '#333';
          }} className="p-[10px_25px] [border:1px_solid_#ddd] bg-white rounded-[6px] cursor-pointer text-[14px] text-[#333] font-medium [transition:all_0.2s_ease] [flex:1]">
                Cancel
              </button>

              <button onClick={confirmLogout} onMouseEnter={e => {
            e.currentTarget.style.background = '#c82333';
          }} onMouseLeave={e => {
            e.currentTarget.style.background = '#dc3545';
          }} className="p-[10px_25px] border-0 bg-[#dc3545] text-white rounded-[6px] cursor-pointer text-[14px] font-medium [transition:all_0.2s_ease] [flex:1]">
                Logout
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
function MenuItem({
  icon,
  children,
  active,
  onClick
}) {
  return <div onClick={onClick} style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '15px 20px',
    cursor: 'pointer',
    background: active ? '#0b7a3a' : 'transparent',
    color: active ? '#fff' : '#333',
    borderRadius: 8,
    transition: 'all 0.2s ease',
    border: active ? 'none' : '1px solid #e0e0e0',
    fontWeight: active ? '600' : '500',
    fontSize: 15
  }} onMouseEnter={e => {
    if (!active) {
      e.currentTarget.style.background = '#f5f5f5';
    }
  }} onMouseLeave={e => {
    if (!active) {
      e.currentTarget.style.background = 'transparent';
    }
  }}>
      {icon && <span className="flex text-[16px]">{icon}</span>}
      <span className="whitespace-nowrap overflow-hidden [text-overflow:ellipsis]">
        {children}
      </span>
    </div>;
}
