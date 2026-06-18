import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaCamera, FaLock, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import api, { API_BASE_URL } from "../../services/api";
import { ProfileSkeleton } from "../../components/Skeleton";
function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const fileInputRef = useRef(null);
  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    try {
      const res = await api.get('/protected');
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleImageUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }
    if (!user) {
      alert("Profile data not loaded. Please refresh the page.");
      return;
    }
    setUploading(true);
    try {
      const userId = user.user_id || user.id;
      if (!userId) {
        throw new Error("Cannot find user ID. Please refresh the page.");
      }
      console.log('Uploading admin image for ID:', userId);
      const formData = new FormData();
      formData.append('profile_image', file);
      const response = await api.post(`/profile/upload/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(' Upload success:', response.data);
      const newFilename = response.data.filename;
      const fullImageUrl = `${API_BASE_URL}/uploads/profile/${newFilename}`;
      console.log('New admin image URL:', fullImageUrl);
      setUser(prev => ({
        ...prev,
        profile_image: fullImageUrl
      }));
      window.dispatchEvent(new CustomEvent("profileUpdated", {
        detail: {
          profile_image: fullImageUrl,
          user_name: user.user_name || user.name || "Admin"
        }
      }));
      localStorage.setItem('profileImage', fullImageUrl);
      alert('Profile image updated successfully!');
    } catch (err) {
      console.error(' Upload error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      let errorMessage = 'Failed to upload image';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Upload endpoint not found. Please contact administrator.';
        } else if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      alert(`Upload error: ${errorMessage}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      alert("New passwords don't match!");
      return;
    }
    if (passwords.new.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in!");
        return;
      }
      await api.post("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswords({
        current: "",
        new: "",
        confirm: ""
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change password");
    }
  };
  if (loading) {
    return <ProfileSkeleton />;
  }
  const getDisplayImageUrl = imageName => {
    if (!imageName || imageName === 'null' || imageName === 'undefined') {
      return null;
    }
    if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
      return imageName;
    }
    return `${API_BASE_URL}/uploads/profile/${imageName}`;
  };
  return <div className="min-h-[100vh] bg-[linear-gradient(135deg,_#f5f7fa_0%,_#c3cfe2_100%)] flex items-center justify-center p-[40px_20px]">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="max-w-[450px] w-full bg-[#0b7a3a] rounded-[24px] [box-shadow:0_20px_60px_rgba(0,0,0,0.3)] [overflow:visible] relative pt-[80px]">
      
        <div style={{
        position: "absolute",
        top: -60,
        left: "50%",
        transform: "translateX(-50%)"
      }}>
          <label style={{
          cursor: uploading ? 'not-allowed' : 'pointer',
          position: 'relative',
          display: 'block'
        }}>
            <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden [border:4px_solid_green] [box-shadow:0_8px_24px_rgba(0,0,0,0.2)] bg-white">
              {user?.profile_image ? <img src={getDisplayImageUrl(user.profile_image)} alt="Profile" className="w-full h-[100%] object-cover" /> : <div className="w-full h-[100%] bg-[linear-gradient(135deg,_#0b7a3a_0%,_#096030_100%)] flex items-center justify-center text-[50px] text-white">
                  <FaUser />
                </div>}
              
           
              {!uploading && <div onMouseEnter={e => e.target.style.background = "rgba(0,0,0,0.7)"} onMouseLeave={e => e.target.style.background = "rgba(0,0,0,0.5)"} className="absolute [bottom:0] [right:0] bg-[rgba(0,0,0,0.5)] w-[40px] h-[40px] rounded-full flex items-center justify-center [box-shadow:0_2px_8px_rgba(0,0,0,0.3)] [transition:all_0.3s_ease] [border:3px_solid_white]">
                  <FaCamera className="text-[16px] text-white" />
                </div>}

           
              {uploading && <div className="absolute [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.7)] flex items-center justify-center text-white text-[14px] font-semibold">
                  Uploading...
                </div>}
            </div>
            
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

     
        <div className="p-[40px_30px_40px] text-center text-white">
          
       
          <h2 className="text-[28px] font-bold m-[0_0_10px] text-white">
            Name: {user?.user_name || user?.name || 'Admin'}
          </h2>

          {/* ID */}
          <p className="text-[18px] m-[0_0_30px] text-[rgba(255,255,255,0.95)]">
            ID: {user?.user_id || user?.id || 'N/A'}
          </p>

         
          <div className="[display:inline-block] bg-[rgba(255,_255,_255,_0.2)] p-[10px_25px] rounded-[8px] text-[16px] font-bold text-white mb-[40px] [border:2px_solid_rgba(255,255,255,0.3)]">
            {user?.user_role || user?.role || 'N/A'}
          </div>

      
          <button onClick={() => setShowPasswordModal(true)} onMouseEnter={e => {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
        }} onMouseLeave={e => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }} className="w-full p-[14px] bg-white text-[#0b7a3a] border-0 rounded-[12px] text-[17px] font-bold cursor-pointer [transition:all_0.3s_ease] [box-shadow:0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center m-[0_auto]">
            <FaLock className="mr-[10px]" /> Change Password
          </button>
        </div>
      </motion.div>


      {showPasswordModal && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} onClick={() => setShowPasswordModal(false)} className="fixed [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.6)] flex items-center justify-center [z-index:1000] p-[20px]">
          <motion.div initial={{
        scale: 0.9,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} onClick={e => e.stopPropagation()} className="bg-white p-[40px] rounded-[16px] max-w-[500px] w-full [box-shadow:0_20px_60px_rgba(0,0,0,0.3)] relative">
            {/* Close button */}
            <button onClick={() => setShowPasswordModal(false)} onMouseEnter={e => e.target.style.color = "#0b7a3a"} onMouseLeave={e => e.target.style.color = "#718096"} className="absolute [top:15px] [right:15px] bg-[transparent] border-0 text-[24px] text-[#718096] cursor-pointer p-[5px] [transition:color_0.3s_ease]">
              <FaTimes />
            </button>

            <div className="flex items-center [gap:12px] mb-[25px]">
              <div className="w-[50px] h-[50px] rounded-full bg-[#f0fdf4] flex items-center justify-center">
                <FaLock className="text-[22px] text-[#0b7a3a]" />
              </div>
              <div>
                <h3 className="text-[22px] font-bold text-[#1a202c] m-0">
                  Change Password
                </h3>
                <p className="text-[14px] text-[#718096] m-0">
                  Enter your current and new password
                </p>
              </div>
            </div>

         
            <div className="mb-[20px] relative">
              <label className="block text-[14px] font-semibold text-[#4a5568] mb-[8px]">
                Current Password
              </label>
              <input type={showPasswords.current ? "text" : "password"} placeholder="Enter current password" value={passwords.current} onChange={e => setPasswords({
            ...passwords,
            current: e.target.value
          })} onFocus={e => e.target.style.borderColor = "#0b7a3a"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} className="w-full p-[12px_40px_12px_16px] [border:2px_solid_#e2e8f0] rounded-[8px] bg-white text-black text-[15px] [transition:all_0.3s_ease] [box-sizing:border-box]" />
              <span onClick={() => setShowPasswords(prev => ({
            ...prev,
            current: !prev.current
          }))} className="absolute [right:12px] [top:70%] [transform:translateY(-50%)] cursor-pointer text-[#718096]">
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

       
            <div className="mb-[20px] relative">
              <label className="block text-[14px] font-semibold text-[#4a5568] mb-[8px]">
                New Password
              </label>
              <input type={showPasswords.new ? "text" : "password"} placeholder="Enter new password (min 6 characters)" value={passwords.new} onChange={e => setPasswords({
            ...passwords,
            new: e.target.value
          })} onFocus={e => e.target.style.borderColor = "#0b7a3a"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} className="w-full p-[12px_40px_12px_16px] [border:2px_solid_#e2e8f0] rounded-[8px] bg-white text-black text-[15px] [transition:all_0.3s_ease] [box-sizing:border-box]" />
              <span onClick={() => setShowPasswords(prev => ({
            ...prev,
            new: !prev.new
          }))} className="absolute [right:12px] [top:70%] [transform:translateY(-50%)] cursor-pointer text-[#718096]">
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

          
            <div className="mb-[30px] relative">
              <label className="block text-[14px] font-semibold text-[#4a5568] mb-[8px]">
                Confirm New Password
              </label>
              <input type={showPasswords.confirm ? "text" : "password"} placeholder="Confirm new password" value={passwords.confirm} onChange={e => setPasswords({
            ...passwords,
            confirm: e.target.value
          })} onFocus={e => e.target.style.borderColor = "#0b7a3a"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} className="w-full p-[12px_40px_12px_16px] [border:2px_solid_#e2e8f0] rounded-[8px] bg-white text-black text-[15px] [transition:all_0.3s_ease] [box-sizing:border-box]" />
              <span onClick={() => setShowPasswords(prev => ({
            ...prev,
            confirm: !prev.confirm
          }))} className="absolute [right:12px] [top:70%] [transform:translateY(-50%)] cursor-pointer text-[#718096]">
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="flex [gap:12px]">
              <button onClick={handlePasswordChange} disabled={uploading} style={{
            flex: 1,
            padding: "14px",
            background: "#0b7a3a",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
            transition: "all 0.3s ease"
          }} onMouseEnter={e => !uploading && (e.target.style.background = "#096030")} onMouseLeave={e => !uploading && (e.target.style.background = "#0b7a3a")}>
                Update Password
              </button>

              <button onClick={() => {
            setShowPasswordModal(false);
            setPasswords({
              current: "",
              new: "",
              confirm: ""
            });
          }} disabled={uploading} style={{
            flex: 1,
            padding: "14px",
            background: "white",
            color: "#718096",
            border: "2px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: uploading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }} onMouseEnter={e => !uploading && (e.target.style.background = "#f7fafc")} onMouseLeave={e => !uploading && (e.target.style.background = "white")}>
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>}

      
    </div>;
}
export default AdminProfile;
