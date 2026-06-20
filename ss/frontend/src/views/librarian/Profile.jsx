import React, { useState, useEffect } from "react";
import { FaUser, FaCamera, FaLock, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import api, { API_BASE_URL } from "../../services/api";
function Profile() {
  const [profile, setProfile] = useState({
    user_name: "",
    user_id: "",
    profile_image: "",
    role: "Loading Role..."
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
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


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/profile");
        console.log("User Profile data:", res.data);
        const imageUrl = res.data.profile_image ? `${API_BASE_URL}/uploads/profile/${res.data.profile_image}` : res.data.image || "";
        setProfile({
          user_name: res.data.user_name || res.data.name || "",
          user_id: res.data.user_id || res.data.id || "",
          profile_image: imageUrl,
   
          role: res.data.role || "User"
        });
        if (res.data.user_id || res.data.id) {
          localStorage.setItem("userId", res.data.user_id || res.data.id);
        }
      } catch (err) {
        console.log("Failed to load profile:", err);
        setProfile(prev => ({
          ...prev,
          role: "Unknown Role"
        }));
      }
    };
    fetchProfile();
  }, []);
  const handleFileChange = e => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      if (selectedFile) {
        autoUploadImage(selectedFile);
      }
    }
  };
  const autoUploadImage = async selectedFile => {
    setLoading(true);
    const formData = new FormData();
    formData.append("profile_image", selectedFile);
    try {
      const userId = profile.user_id || localStorage.getItem("userId");
      if (!userId) {
        alert("User ID not found. Please try logging in again.");
        setLoading(false);
        return;
      }
      const res = await api.post(`/profile/upload/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      console.log("Upload response:", res.data);
      const newImage = `${API_BASE_URL}/uploads/profile/${res.data.filename}`;
      setProfile({
        ...profile,
        profile_image: newImage
      });
      localStorage.setItem("profileImage", newImage);
      window.dispatchEvent(new CustomEvent("profileUpdated", {
        detail: {
          profile_image: newImage
        }
      }));
      alert("Profile image updated successfully!");
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error("Auto-upload error:", err);
      alert(err.response?.data?.message || "Auto-upload failed!");
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      alert("New passwords don't match!");
      return;
    }
    if (passwords.new.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/user/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      alert("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswords({
        current: "",
        new: "",
        confirm: ""
      });
    } catch (err) {
      alert(err.response?.data?.message || "Password change failed");
    } finally {
      setLoading(false);
    }
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
          <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden [border:4px_solid_green] [box-shadow:0_8px_24px_rgba(0,0,0,0.2)] bg-white">
            {loading && <div className="absolute [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.6)] flex items-center justify-center [z-index:10]">
                <span className="text-white font-bold text-[14px]">Uploading...</span>
              </div>}
            {preview || profile.profile_image ? <img src={preview || profile.profile_image} alt="profile" className="w-full h-[100%] object-cover" /> : <div className="w-full h-[100%] bg-[linear-gradient(135deg,_#0b7a3a_0%,_#096030_100%)] flex items-center justify-center text-[50px] text-white">
                <FaUser />
              </div>}
            
       
            <label htmlFor="file-upload" style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            background: "rgba(0,0,0,0.5)",
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            opacity: loading ? 0.4 : 1
          }} onMouseEnter={e => {
            if (!loading) e.target.style.background = "rgba(0,0,0,0.7)";
          }} onMouseLeave={e => {
            if (!loading) e.target.style.background = "rgba(0,0,0,0.5)";
          }}>
              <FaCamera className="text-[16px] text-white" />
            </label>
            <input id="file-upload" type="file" onChange={handleFileChange} accept="image/*" disabled={loading} className="hidden" />
          </div>
        </div>


        <div className="p-[40px_30px_40px] text-center text-white">
   
          <h2 className="text-[28px] font-bold m-[0_0_10px] text-white">
            Name: {profile.user_name || "Loading..."}
          </h2>

     
          <p className="text-[18px] m-[0_0_30px] text-[rgba(255,255,255,0.95)]">
            ID: {profile.user_id || "Loading..."}
          </p>

 
          <div className="[display:inline-block] bg-[rgba(255,_255,_255,_0.2)] p-[10px_25px] rounded-[8px] text-[16px] font-bold text-white mb-[40px] [border:2px_solid_rgba(255,255,255,0.3)]">
            {profile.role || "Administrator"} 
          </div>

      
          
  
          <button onClick={() => setShowPasswordModal(true)} disabled={loading} style={{
          width: "100%",
          padding: "14px",
          background: "white",
          color: "#0b7a3a",
          border: "none",
          borderRadius: 12,
          fontSize: 17,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "all 0.3s ease",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto"
        }} onMouseEnter={e => {
          if (!loading) e.target.style.transform = "translateY(-1px)";
        }} onMouseLeave={e => {
          if (!loading) e.target.style.transform = "translateY(0)";
        }}>
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
              <button onClick={handlePasswordChange} disabled={loading} style={{
            flex: 1,
            padding: "14px",
            background: "#0b7a3a",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.3s ease"
          }} onMouseEnter={e => !loading && (e.target.style.background = "#096030")} onMouseLeave={e => !loading && (e.target.style.background = "#0b7a3a")}>
                {loading ? "Updating..." : "Update Password"}
              </button>

              <button onClick={() => setShowPasswordModal(false)} disabled={loading} style={{
            flex: 1,
            padding: "14px",
            background: "white",
            color: "#718096",
            border: "2px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }} onMouseEnter={e => !loading && (e.target.style.background = "#f7fafc")} onMouseLeave={e => !loading && (e.target.style.background = "white")}>
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>}
    </div>;
}
export default Profile;
