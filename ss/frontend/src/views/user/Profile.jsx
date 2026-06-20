import React, { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaCamera, FaLock, FaDownload, FaEye, FaEyeSlash } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import api, { API_BASE_URL } from "../../services/api";
import { ProfileSkeleton } from "../../components/Skeleton";
function Profile() {
  const {
    user
  } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [uploading, setUploading] = useState(false);
  const qrRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log(" Fetching profile with current user context:", user);
      const res = await api.get(`/user/profile`);
      console.log(" RAW API RESPONSE from /user/profile:", res.data);
      const fetchedData = res.data;
      if (fetchedData.profile_image) {
        console.log("Raw profile image path:", fetchedData.profile_image);
        fetchedData.profile_image = getProfileImageUrl(fetchedData.profile_image);
        console.log(" Processed profile image URL:", fetchedData.profile_image);
        localStorage.setItem('profileImage', fetchedData.profile_image);
      }
      console.log(" Processed User Data for display:", fetchedData);
      setUserData(fetchedData);
    } catch (err) {
      console.error(" Fetch Error:", err);
      console.error(" Error Response:", err.response?.data);
      const fallbackData = {
        name: user?.name,
        id: user?.id,
        role: user?.role,
        c_id: user?.c_id,
        s_id: user?.s_id,
        j_id: user?.j_id,
        e_id: user?.e_id,
        t_id: user?.t_id,
        i_id: user?.i_id,
        c_name: user?.c_name,
        s_name: user?.s_name,
        j_name: user?.j_name,
        e_name: user?.e_name,
        t_name: user?.t_name,
        i_name: user?.i_name,
        profile_image: localStorage.getItem('profileImage')
      };
      console.log("📊 Using fallback data:", fallbackData);
      setUserData(fallbackData);
    } finally {
      setLoading(false);
    }
  };
  const getProfileImageUrl = imagePath => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath === '') {
      return null;
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.replace(/^\/+|\/+$/g, '');
    return `${API_BASE_URL}/uploads/profile/${cleanPath}`;
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
    if (!userData) {
      alert("User data is not ready. Please try again.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('profile_image', file);
    try {
      let uploadId = null;
      const idFields = ['id', 'user_id', 'student_id', 'employee_id', 'teacher_id', 'instructor_id', 'c_id', 's_id', 'j_id', 'e_id', 't_id', 'i_id'];
      for (const field of idFields) {
        if (userData[field]) {
          uploadId = userData[field];
          console.log(` Found ID in field ${field}:`, uploadId);
          break;
        }
      }
      if (!uploadId) {
        throw new Error("Cannot find user ID in profile data");
      }
      console.log(" Uploading image for user ID:", uploadId);
      console.log(" User data:", userData);
      let endpoint = `/upload/${uploadId}`;
      let response = null;
      try {
        response = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log(" Upload successful via endpoint:", endpoint);
      } catch (endpointError) {
        console.log(" First endpoint failed, trying alternative...");
        endpoint = `/profile/upload/${uploadId}`;
        response = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log("Upload successful via alternative endpoint:", endpoint);
      }
      console.log(" Upload response:", response.data);
      let newFilename = response.data.filename || response.data.image || response.data.profile_image;
      if (!newFilename) {
        newFilename = file.name;
      }
      const fullImageUrl = getProfileImageUrl(newFilename);
      console.log(" New profile image URL:", fullImageUrl);
      const updatedUserData = {
        ...userData,
        profile_image: fullImageUrl
      };
      setUserData(updatedUserData);
      const userName = userData.name || userData.c_name || userData.s_name || userData.j_name || userData.e_name || userData.t_name || userData.i_name || "User";
      window.dispatchEvent(new CustomEvent("profileUpdated", {
        detail: {
          profile_image: fullImageUrl,
          user_name: userName
        }
      }));
      localStorage.setItem('profileImage', fullImageUrl);
      alert('Profile image updated successfully!');
    } catch (err) {
      console.error('UPLOAD ERROR:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        endpoint: err.config?.url
      });
      let errorMessage = 'Failed to upload image';
      if (err.response?.status === 404) {
        errorMessage = 'Upload endpoint not found. Please contact administrator.';
      } else if (err.response?.status === 413) {
        errorMessage = 'File is too large. Maximum size is 2MB.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
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
    if (passwords.new.length < 3) {
      alert("Password must be at least 3 characters");
      return;
    }
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
      alert(err.response?.data?.message || "Failed to change password");
    }
  };
  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${userData?.c_name || userData?.s_name || userData?.j_name || userData?.e_name || userData?.t_name || userData?.i_name || 'user'}-QRCode.png`;
      a.click();
    }
  };
  const generateQRValue = () => {
    if (!userData) return "Loading...";
    let qrDataArray = [];
    if (userData.c_id) {
      qrDataArray = [userData.c_id, userData.c_name, userData.c_program, userData.c_year_block];
    } else if (userData.s_id) {
      qrDataArray = [userData.s_id, userData.s_name || userData.S_name, userData.s_program, userData.s_gradelevel, userData.s_section];
    } else if (userData.t_id) {
      qrDataArray = [userData.t_id, userData.t_name, userData.t_teacherlevel];
    } else if (userData.i_id || userData.id && /^23-G-\d+$/.test(userData.id)) {
      qrDataArray = [userData.i_id || userData.id, userData.i_name || userData.name, userData.i_instructorlevel || userData.level];
    } else if (userData.e_id || userData.e_program && ["1", "2", "3", "4", "5", "6"].includes(String(userData.e_program))) {
      qrDataArray = [userData.e_id, userData.e_name, userData.e_program, userData.e_section];
    } else if (userData.j_id || userData.j_program && ["7", "8", "9", "10"].includes(String(userData.j_program))) {
      qrDataArray = [userData.j_id, userData.j_name, userData.j_program, userData.j_section];
    }
    return qrDataArray.filter(item => item !== null && item !== undefined).join(" | ");
  };
  const getDisplayInfo = () => {
    if (!userData) return {
      name: "Loading...",
      id: "...",
      program: "..."
    };
    console.log(" getDisplayInfo - userData:", userData);
    if (userData.t_id || userData.t_name && userData.t_teacherlevel) {
      return {
        name: userData.t_name || userData.name,
        id: userData.t_id || userData.id,
        program: `Position - ${userData.t_teacherlevel || userData.level}`
      };
    }
    if (userData.i_id || userData.i_name && userData.i_instructorlevel) {
      return {
        name: userData.i_name || userData.name,
        id: userData.i_id || userData.id,
        program: `Position - ${userData.i_instructorlevel || userData.level}`
      };
    }
    const userId = userData.id || userData.i_id || userData.t_id || userData.c_id || userData.s_id || userData.j_id || userData.e_id;
    if (userId && /^23-G-\d{6,8}$/.test(userId)) {
      if (userData.t_teacherlevel !== undefined) {
        return {
          name: userData.t_name || userData.name || "Teacher",
          id: userId,
          program: `Position - ${userData.t_teacherlevel}`
        };
      } else if (userData.i_instructorlevel !== undefined) {
        return {
          name: userData.i_name || userData.name || "Instructor",
          id: userId,
          program: `Position - ${userData.i_instructorlevel}`
        };
      } else {
        return {
          name: userData.name || "Faculty",
          id: userId,
          program: "Faculty Member"
        };
      }
    }
    if (userData.c_id) {
      return {
        name: userData.c_name || userData.name,
        id: userData.c_id,
        program: `${userData.c_program || ""} - ${userData.c_year_block || ""}`
      };
    }
    if (userData.s_id) {
      return {
        name: userData.s_name || userData.name,
        id: userData.s_id,
        program: `${userData.s_program || ""} - Grade ${userData.s_gradelevel || ""} ${userData.s_section || ""}`
      };
    }
    if (userData.j_id) {
      return {
        name: userData.j_name || userData.name,
        id: userData.j_id,
        program: ` ${userData.j_program || ""} - ${userData.j_section || ""}`
      };
    }
    if (userData.e_id) {
      return {
        name: userData.e_name || userData.name,
        id: userData.e_id,
        program: ` ${userData.e_program || ""} - ${userData.e_section || ""}`
      };
    }
    return {
      name: user?.name || userData?.name || "User",
      id: userId || "N/A",
      program: user?.role || userData?.role || "N/A"
    };
  };
  const displayInfo = getDisplayInfo();
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "70vh",
    padding: "20px",
    background: '#f5f7fa',
    width: '100%',
    boxSizing: 'border-box'
  };
  const cardStyle = {
    background: "#0b7a3a",
    padding: "40px 30px 30px",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
    color: "white",
    maxWidth: 500,
    width: "100%",
    position: "relative",
    margin: "0 auto",
    '@media (max-width: 768px)': {
      padding: "35px 25px 25px",
      maxWidth: '90%'
    },
    '@media (max-width: 480px)': {
      padding: "30px 20px 20px",
      maxWidth: '95%'
    }
  };
  const profileImageContainerStyle = {
    position: "relative",
    display: "inline-block",
    margin: "-70px auto 20px",
    '@media (max-width: 768px)': {
      margin: "-60px auto 15px"
    },
    '@media (max-width: 480px)': {
      margin: "-50px auto 15px"
    }
  };
  const profileImageStyle = {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 50,
    color: "#0b7a3a",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    overflow: "hidden",
    position: "relative",
    '@media (max-width: 768px)': {
      width: 110,
      height: 110,
      fontSize: 45
    },
    '@media (max-width: 480px)': {
      width: 100,
      height: 100,
      fontSize: 40
    }
  };
  const nameStyle = {
    margin: "15px 0 8px",
    fontSize: 22,
    fontWeight: "600",
    wordBreak: "break-word",
    '@media (max-width: 768px)': {
      fontSize: 20,
      margin: "12px 0 6px"
    },
    '@media (max-width: 480px)': {
      fontSize: 18,
      margin: "10px 0 5px"
    }
  };
  const infoTextStyle = {
    margin: "5px 0",
    fontSize: 15,
    opacity: 0.95,
    wordBreak: "break-word",
    '@media (max-width: 768px)': {
      fontSize: 14
    },
    '@media (max-width: 480px)': {
      fontSize: 13
    }
  };
  const qrContainerStyle = {
    background: "white",
    padding: 20,
    borderRadius: 8,
    display: "inline-block",
    marginBottom: 20,
    '@media (max-width: 768px)': {
      padding: 15,
      marginBottom: 15
    },
    '@media (max-width: 480px)': {
      padding: 12,
      marginBottom: 12
    }
  };
  const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 20,
    '@media (max-width: 480px)': {
      gap: 10,
      marginTop: 15
    }
  };
  const primaryButtonStyle = {
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
    margin: "0 auto",
    '@media (max-width: 768px)': {
      padding: "12px",
      fontSize: 16,
      borderRadius: 10
    },
    '@media (max-width: 480px)': {
      padding: "10px",
      fontSize: 15,
      borderRadius: 8
    }
  };
  const secondaryButtonStyle = {
    padding: "12px",
    background: "#0056b3",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: 15,
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    '@media (max-width: 768px)': {
      padding: "10px",
      fontSize: 14
    },
    '@media (max-width: 480px)': {
      padding: "8px",
      fontSize: 13
    }
  };
  const modalContainerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
    '@media (max-width: 480px)': {
      padding: "10px"
    }
  };
  const modalContentStyle = {
    background: "white",
    padding: "25px",
    borderRadius: 12,
    maxWidth: 450,
    width: "100%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    position: "relative",
    '@media (max-width: 768px)': {
      padding: "20px",
      maxWidth: '90%'
    },
    '@media (max-width: 480px)': {
      padding: "15px",
      maxWidth: '95%'
    }
  };
  const modalInputStyle = {
    width: "100%",
    padding: "12px",
    background: "white",
    color: "black",
    borderRadius: 6,
    border: "1px solid #ddd",
    boxSizing: "border-box",
    fontSize: 14,
    '@media (max-width: 480px)': {
      padding: "10px",
      fontSize: 13
    }
  };
  if (loading) {
    return <ProfileSkeleton />;
  }
  return <div style={containerStyle}>
      <div style={cardStyle}>

  
        <div style={profileImageContainerStyle}>
          <label htmlFor="profile-upload-input" style={{
          cursor: uploading ? 'not-allowed' : 'pointer',
          position: 'relative',
          display: 'block'
        }}>
            <div style={profileImageStyle} onMouseOver={e => {
            const overlay = e.currentTarget.querySelector('.upload-overlay');
            if (overlay) overlay.style.opacity = '1';
          }} onMouseOut={e => {
            const overlay = e.currentTarget.querySelector('.upload-overlay');
            if (overlay) overlay.style.opacity = '0';
          }}>
              {userData?.profile_image ? <img src={userData.profile_image} alt="Profile" onError={e => {
              console.error("Image failed to load:", userData.profile_image);
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              const faIcon = document.createElement('div');
              faIcon.innerHTML = '<FaUser />';
              parent.appendChild(faIcon);
            }} className="w-full h-[100%] object-cover" /> : <FaUser />}
              
              <div className="upload-overlay absolute [top:0] [left:0] [right:0] [bottom:0] bg-[rgba(0,0,0,0.5)] flex items-center justify-center [opacity:0] [transition:opacity_0.3s] rounded-full">
                <FaCamera style={{
                color: 'white',
                fontSize: 24,
                '@media (max-width: 480px)': {
                  fontSize: 20
                }
              }} />
              </div>
            </div>
            
            <input id="profile-upload-input" ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
          </label>
          
          {uploading && <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          color: 'white',
          zIndex: 10,
          fontSize: 14,
          '@media (max-width: 480px)': {
            fontSize: 12
          }
        }}>
              Uploading...
            </div>}
        </div>


        <h2 style={nameStyle}>
          Name: {displayInfo.name}
        </h2>
        <p style={infoTextStyle}>
          ID: {displayInfo.id}
        </p>
        <p style={{
        ...infoTextStyle,
        marginBottom: 30
      }}>
          {displayInfo.program}
        </p>


        <div ref={qrRef} style={qrContainerStyle}>
          <QRCodeCanvas value={generateQRValue()} size={200} style={{
          '@media (max-width: 768px)': {
            width: 180,
            height: 180
          },
          '@media (max-width: 480px)': {
            width: 160,
            height: 160
          }
        }} />
        </div>

     
        <div style={buttonContainerStyle}>
          <button onClick={() => setShowPasswordModal(true)} disabled={loading} style={primaryButtonStyle} onMouseEnter={e => {
          if (!loading) e.target.style.transform = "translateY(-1px)";
        }} onMouseLeave={e => {
          if (!loading) e.target.style.transform = "translateY(0)";
        }}>
            <FaLock style={{
            marginRight: 10,
            '@media (max-width: 480px)': {
              marginRight: 8,
              fontSize: 14
            }
          }} /> 
            Change Password
          </button>
          
          <button onClick={downloadQR} style={secondaryButtonStyle} onMouseOver={e => e.target.style.transform = "scale(1.02)"} onMouseOut={e => e.target.style.transform = "scale(1)"}>
            <FaDownload className="text-[16px]" />
            Download QRCode
          </button>
        </div>
      </div>

   
      {showPasswordModal && <div style={modalContainerStyle}>
          <div style={modalContentStyle}>
            <button onClick={() => {
          setShowPasswordModal(false);
          setPasswords({
            current: "",
            new: "",
            confirm: ""
          });
        }} style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "transparent",
          border: "none",
          fontSize: 24,
          cursor: "pointer",
          color: "#999",
          lineHeight: 1,
          width: 30,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          '@media (max-width: 480px)': {
            top: 8,
            right: 8,
            fontSize: 20
          }
        }}>
              ×
            </button>

            <h3 style={{
          marginBottom: 20,
          color: "#333",
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          '@media (max-width: 768px)': {
            fontSize: 20,
            marginBottom: 15
          },
          '@media (max-width: 480px)': {
            fontSize: 18
          }
        }}>
              <FaLock style={{
            fontSize: 22,
            color: "#0b7a3a",
            marginRight: 12,
            '@media (max-width: 480px)': {
              fontSize: 18,
              marginRight: 10
            }
          }} />
              Change Password
            </h3>
            
       
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
            
            <div style={{
          display: "flex",
          gap: 12,
          '@media (max-width: 480px)': {
            flexDirection: 'column',
            gap: 10
          }
        }}>
              <button onClick={handlePasswordChange} style={{
            flex: 1,
            padding: "12px",
            background: "#0b7a3a",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: "600",
            '@media (max-width: 480px)': {
              fontSize: 14,
              padding: "10px"
            }
          }}>
                Update Password
              </button>
              <button onClick={() => {
            setShowPasswordModal(false);
            setPasswords({
              current: "",
              new: "",
              confirm: ""
            });
          }} style={{
            flex: 1,
            padding: "12px",
            background: "#666",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: "600",
            '@media (max-width: 480px)': {
              fontSize: 14,
              padding: "10px"
            }
          }}>
                Cancel
              </button>
            </div>
          </div>
        </div>}

 
      
    </div>;
}
export default Profile;
