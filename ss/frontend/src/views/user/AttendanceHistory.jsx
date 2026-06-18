import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { FaCalendarAlt, FaClock, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { SkeletonBlock, TableSkeleton } from "../../components/Skeleton";
function AttendanceHistory() {
  const {
    user
  } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("date");
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [isStaffAccount, setIsStaffAccount] = useState(false);
  const getUserId = () => {
    console.log(" Current user object:", user);
    if (user?.studentId) {
      console.log("Found studentId in user object:", user.studentId);
      return user.studentId.trim();
    }
    const idFields = ['id', 'user_id', 'userId', 'student_id', 'studentId', 'c_id', 's_id', 'j_id', 'e_id', 't_id', 'i_id'];
    for (const field of idFields) {
      if (user?.[field] && user[field] !== "undefined" && user[field] !== "null" && String(user[field]).trim() !== "") {
        console.log(`Found ID in user.${field}:`, user[field]);
        return String(user[field]).trim();
      }
    }
    console.log(" Checking localStorage for student ID...");
    const storageKeys = ['studentId', 'student_id', 'userId', 'user_id', 'id', 'c_id', 's_id', 'j_id', 'e_id', 't_id', 'i_id'];
    for (const key of storageKeys) {
      const id = localStorage.getItem(key);
      if (id && id !== "undefined" && id !== "null" && id.trim() !== "") {
        console.log(` Found ID in localStorage.${key}:`, id);
        return id.trim();
      }
    }
    console.log("LocalStorage contents:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}: ${localStorage.getItem(key)}`);
    }
    console.log(" No student ID found");
    return null;
  };
  const getUserName = () => {
    return user?.name || user?.username || user?.user_name || user?.c_name || user?.s_name || user?.j_name || user?.e_name || user?.t_name || user?.i_name || user?.ls_name || localStorage.getItem("name") || localStorage.getItem("username") || "User";
  };
  const mapAttendanceRecord = rec => {
    console.log(" Mapping record:", rec);
    const result = {
      id: rec.ID || rec.id || rec.ac_id || rec.as_id || rec.aj_id || rec.ae_id || rec.at_id || rec.ai_id || 'N/A',
      name: rec.Name || rec.name || rec.ac_name || rec.as_name || rec.aj_name || rec.ae_name || rec.at_name || rec.ai_name || 'Unknown',
      date: rec.Date || rec.date || rec.ac_date || rec.as_date || rec.aj_date || rec.ae_date || rec.at_date || rec.ai_date || 'N/A',
      timeIn: rec["Time In"] || rec.timeIn || rec.ac_timein || rec.as_timein || rec.aj_timein || rec.ae_timein || rec.at_timein || rec.ai_timein || null,
      timeOut: rec["Time Out"] || rec.timeOut || rec.ac_timeout || rec.as_timeout || rec.aj_timeout || rec.ae_timeout || rec.at_timeout || rec.ai_timeout || null,
      status: rec.Status || (rec.timeOut ? "Completed" : "Time-In Only"),
      category: rec.category || 'unknown'
    };
    const convertTimeTo12Hour = time24 => {
      if (!time24) return null;
      if (time24.toLowerCase().includes('am') || time24.toLowerCase().includes('pm')) {
        return time24;
      }
      try {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      } catch (e) {
        return time24;
      }
    };
    result.timeIn = convertTimeTo12Hour(result.timeIn);
    result.timeOut = convertTimeTo12Hour(result.timeOut);
    return result;
  };
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }
    viewMode === "date" ? fetchAttendanceByDate(userId) : fetchAllAttendance(userId);
  }, [selectedDate, viewMode, user]);
  const fetchAttendanceByDate = async userId => {
    setLoading(true);
    setError(null);
    setIsStaffAccount(false);
    setAttendance([]);
    try {
      console.log(" Fetching attendance for userId:", userId, "date:", selectedDate);
      const res = await api.get("/attendance/my-history", {
        params: {
          userId: userId,
          date: selectedDate
        }
      });
      console.log("Response received:", res.data);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const category = res.data[0].category;
        setDetectedCategory(category);
        // Map each record using the enhanced mapping function
        const mappedRecords = res.data.map(rec => mapAttendanceRecord(rec));
        console.log(" Mapped records:", mappedRecords);
        setAttendance(mappedRecords);
        setError(null);
      } else if (res.data && Array.isArray(res.data) && res.data.length === 0) {
        setAttendance([]);
        setError("No attendance records found for this date.");
      } else {
        console.error(" Invalid response format:", res.data);
        setAttendance([]);
        setError("Invalid response from server");
      }
    } catch (err) {
      console.error(" Error fetching attendance:", err);
      setAttendance([]);
      if (err.response?.status === 403) {
        setIsStaffAccount(true);
        setError(err.response?.data?.message || "Attendance tracking is not available for your account type.");
      } else if (err.response?.status === 404) {
        setError(err.response?.data?.message || "No records found in the system.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Bad request. Please check your user ID.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch attendance. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchAllAttendance = async userId => {
    setLoading(true);
    setError(null);
    setIsStaffAccount(false);
    setAttendance([]);
    try {
      console.log("Fetching all attendance for userId:", userId);
      const res = await api.get("/attendance/my-history", {
        params: {
          userId
        }
      });
      console.log(" Response received:", res.data);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const category = res.data[0].category;
        setDetectedCategory(category);
        const mappedRecords = res.data.map(rec => mapAttendanceRecord(rec));
        console.log(" Mapped records:", mappedRecords);
        setAttendance(mappedRecords);
        setError(null);
      } else if (res.data && Array.isArray(res.data) && res.data.length === 0) {
        setAttendance([]);
        setError("No attendance records found.");
      } else {
        console.error(" Invalid response format:", res.data);
        setAttendance([]);
        setError("Invalid response from server");
      }
    } catch (err) {
      console.error(" Error fetching attendance:", err);
      setAttendance([]);
      if (err.response?.status === 403) {
        setIsStaffAccount(true);
        setError(err.response?.data?.message || "Attendance tracking is not available for your account type.");
      } else if (err.response?.status === 404) {
        setError(err.response?.data?.message || "No records found in the system.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Bad request. Please check your user ID.");
      } else {
        setError(err.response?.data?.message || "Failed to fetch attendance. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const renderTableContent = () => {
    const userId = getUserId();
    const userName = getUserName();
    return <div>
        {detectedCategory && !isStaffAccount && <div className="p-[10px] mb-[15px] bg-[#f0fdf4] [border:2px_solid_#0b7a3a20] rounded-[8px] text-[14px] text-[#0b7a3a] font-semibold flex items-center [gap:8px]">
            <FaCheckCircle /> Detected Category: <span className="capitalize">{detectedCategory}</span>
          </div>}
        
        {isStaffAccount && <div className="p-[20px] mb-[15px] bg-[#fff3cd] [border:2px_solid_#ffc107] rounded-[8px] text-center">
            <FaExclamationTriangle className="text-[48px] text-[#ff9800] mb-[10px]" />
            <h3 className="text-[18px] text-[#856404] mb-[8px] font-semibold">Attendance Not Available</h3>
            <p className="text-[14px] text-[#856404] mb-[0]">
              You are logged in as <strong>Admin/Librarian/Staff</strong>. <br />
              Attendance tracking is only available for students, teachers, and instructors.
            </p>
          </div>}

        {!isStaffAccount && <div className="bg-white rounded-[12px] overflow-hidden [box-shadow:0_2px_4px_rgba(0,0,0,0.08)] w-full overflow-x-auto">
            <div className="min-w-[800px] w-full">
              <table className="w-full [border-collapse:collapse] text-[14px] min-w-[100%]">
                <thead>
                  <tr className="bg-[#0b7a3a] text-white">
                    <th className="p-[16px] text-left font-semibold text-[14px] min-w-[120px] whitespace-nowrap">Date</th>
                    <th className="p-[16px] text-left font-semibold text-[14px] min-w-[100px] whitespace-nowrap">ID</th>
                    <th className="p-[16px] text-left font-semibold text-[14px] min-w-[180px] whitespace-nowrap">Name</th>
                    <th className="p-[16px] text-left font-semibold text-[14px] min-w-[120px] whitespace-nowrap">Time In</th>
                    <th className="p-[16px] text-left font-semibold text-[14px] min-w-[120px] whitespace-nowrap">Time Out</th>
                    <th className="p-[16px] text-center font-semibold text-[14px] min-w-[130px] whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? <tr>
                      <td colSpan={6} className="p-[60px] text-center min-w-[800px]">
                        <div className="flex flex-col items-center [gap:12px]">
                          <FaClock className="text-[48px] text-[#cbd5e0]" />
                          <p className="text-[16px] text-[#718096] font-medium mb-[4px]">
                            {error || ' No attendance records found'}
                          </p>
                          <p className="text-[14px] text-[#a0aec0]">
                            {viewMode === 'date' ? 'Try selecting a different date' : 'Your attendance records will appear here after you scan your QR code'}
                          </p>
                        </div>
                      </td>
                    </tr> : attendance.map((rec, idx) => <motion.tr key={idx} initial={{
                opacity: 0,
                y: 10
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: idx * 0.03
              }} style={{
                borderBottom: "1px solid #e2e8f0",
                transition: "background 0.2s ease",
                background: idx % 2 === 0 ? "#ffffff" : "#f9fafb"
              }} onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"} onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f9fafb"}>
                        <td className="p-[16px] text-[#2d3748] font-medium min-w-[120px] whitespace-nowrap">
                          {rec.date && rec.date !== 'N/A' ? new Date(rec.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'No Date'}
                        </td>
                        <td className="p-[16px] text-[#4a5568] [font-family:monospace] text-[13px] min-w-[100px] whitespace-nowrap">{rec.id !== 'N/A' ? rec.id : userId || 'N/A'}</td>
                        <td className="p-[16px] text-[#2d3748] font-semibold min-w-[180px] whitespace-nowrap">{rec.name !== 'Unknown' ? rec.name : userName}</td>
                        <td className="p-[16px] min-w-[120px] whitespace-nowrap">
                          {rec.timeIn ? <div className="flex items-center [gap:6px]">
                              <span className="[display:inline-block] w-[8px] h-[8px] rounded-full bg-[#10b981]"></span>
                              <span className="text-[#10b981] font-semibold">{rec.timeIn}</span>
                            </div> : <span className="text-[#cbd5e0]">-</span>}
                        </td>
                        <td className="p-[16px] min-w-[120px] whitespace-nowrap">
                          {rec.timeOut ? <div className="flex items-center [gap:6px]">
                              <span className="[display:inline-block] w-[8px] h-[8px] rounded-full bg-[#ef4444]"></span>
                              <span className="text-[#ef4444] font-semibold">{rec.timeOut}</span>
                            </div> : <span className="text-[#fbbf24] font-medium text-[13px]">Pending</span>}
                        </td>
                        <td className="p-[16px] text-center min-w-[130px] whitespace-nowrap">
                          {rec.timeOut ? <span className="inline-flex items-center [gap:4px] p-[4px_12px] bg-[#d1fae5] text-[#065f46] rounded-[12px] text-[12px] font-semibold">
                              <FaCheckCircle /> Complete
                            </span> : rec.timeIn ? <span className="inline-flex items-center [gap:4px] p-[4px_12px] bg-[#fef3c7] text-[#92400e] rounded-[12px] text-[12px] font-semibold">
                              <FaClock /> In Progress
                            </span> : <span className="inline-flex items-center [gap:4px] p-[4px_12px] bg-[#f3f4f6] text-[#6b7280] rounded-[12px] text-[12px] font-semibold">
                              Not Started
                            </span>}
                        </td>
                      </motion.tr>)}
                </tbody>
              </table>
            </div>
          </div>}
      </div>;
  };
  const userId = getUserId();
  const userName = getUserName();
  return <div className="p-[20px] bg-[#f5f7fa] min-h-[100vh]">
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-[30px]">
        <h1 className="text-[32px] font-bold text-[#1a202c] mb-[8px]">
          My Attendance History
        </h1>
        <p className="text-[#718096] text-[16px]">
          View your Time-In and Time-Out records - {userName} {userId ? `(${userId})` : ''}
        </p>
        {!userId && !isStaffAccount && <div className="mt-[10px] p-[15px] bg-[#fff3cd] [border:1px_solid_#ffc107] rounded-[8px] text-[#856404]">
            <strong> User ID not found.</strong> Please log out and log in again.
          </div>}
      </motion.div>

      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.1
    }} className="bg-white p-[25px] rounded-[16px] [box-shadow:0_4px_6px_rgba(0,0,0,0.07)] mb-[20px]">
        <div className="flex [gap:10px] mb-[20px] flex-wrap items-center justify-between">
          <div className="flex [gap:10px]">
            <button onClick={() => setViewMode("date")} disabled={isStaffAccount} style={{
            padding: "12px 24px",
            background: viewMode === "date" ? "#0b7a3a" : "#f0f0f0",
            color: viewMode === "date" ? "white" : "#333",
            border: "none",
            borderRadius: 8,
            cursor: isStaffAccount ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: isStaffAccount ? 0.5 : 1
          }}>
              <FaCalendarAlt /> View by Date
            </button>
            <button onClick={() => setViewMode("all")} disabled={isStaffAccount} style={{
            padding: "12px 24px",
            background: viewMode === "all" ? "#0b7a3a" : "#f0f0f0",
            color: viewMode === "all" ? "white" : "#333",
            border: "none",
            borderRadius: 8,
            cursor: isStaffAccount ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: isStaffAccount ? 0.5 : 1
          }}>
              <FaClock /> View All Records
            </button>
          </div>
          
   
        </div>
        
        {viewMode === "date" && !isStaffAccount && <div>
            <label className="block mb-[10px] font-semibold text-[#4a5568] text-[13px]">
              <FaCalendarAlt className="mr-[6px]" /> Select Date
            </label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} max={new Date().toISOString().split('T')[0]} onFocus={e => e.target.style.borderColor = "#0b7a3a"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} className="p-[12px_20px] rounded-[8px] [border:2px_solid_#e2e8f0] text-[14px] outline-none bg-white text-[#2d3748] cursor-pointer min-w-[200px] [transition:border-color_0.3s_ease]" />
          </div>}
      </motion.div>

      {loading ? <div className="rounded-[16px] bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
          <div className="mb-5 space-y-2">
            <SkeletonBlock className="h-5 w-56" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
          <TableSkeleton rows={5} columns={6} />
        </div> : renderTableContent()}
    </div>;
}
export default AttendanceHistory;
