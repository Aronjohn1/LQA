import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { motion } from "framer-motion";
import { FaFileCsv, FaCalendarDay, FaCalendarWeek, FaCalendarAlt } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CardGridSkeleton, SkeletonBlock } from "../../components/Skeleton";
function Report() {
  const [period, setPeriod] = useState("week");
  const [trendData, setTrendData] = useState([]);
  const [summary, setSummary] = useState({
    today: 0,
    week: 0,
    month: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadAllSummary();
  }, []);
  useEffect(() => {
    loadTrend(period);
  }, [period]);
  const loadAllSummary = async () => {
    try {
      const [todayRes, weekRes, monthRes] = await Promise.all([api.get("/attendance/today/stats"), api.get("/attendance/week/stats"), api.get("/attendance/month/stats")]);
      setSummary({
        today: todayRes.data.total,
        week: weekRes.data.total,
        month: monthRes.data.total
      });
    } catch (err) {
      console.error("Summary error:", err);
    }
  };
  const loadTrend = async p => {
    const days = p === "day" ? 1 : p === "week" ? 7 : 30;
    setLoading(true);
    try {
      const res = await api.get(`/attendance/trend?days=${days}`);
      setTrendData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Trend error:", err);
      setLoading(false);
    }
  };
  const handlePeriodChange = newPeriod => {
    setPeriod(newPeriod);
  };
  const exportCSV = () => {
    const headers = "Date,Visit Count\n";
    const rows = trendData.map(d => `${d.date},${d.count}`).join("\n");
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Attendance_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fa] p-[30px]">
        <SkeletonBlock className="mb-[30px] h-8 w-80 max-w-full" />
        <CardGridSkeleton cards={3} />
        <div className="mt-[30px] rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <SkeletonBlock className="mb-5 h-10 w-64" />
          <SkeletonBlock className="h-[360px] w-full" />
        </div>
      </div>;
  }
  return <div className="p-[30px] bg-[#f5f7fa] min-h-[100vh]">
      <h1 className="text-[28px] font-semibold mb-[30px] text-[#1a202c]">
        Attendance Report Summary
      </h1>

  
      <div className="grid [grid-template-columns:repeat(auto-fit,_minmax(250px,_1fr))] [gap:20px] mb-[30px]">
        <SummaryCard label="Today Visits" value={summary.today} color="#0b7a3a" isActive={period === "day"} onClick={() => handlePeriodChange("day")} />
        <SummaryCard label="This Week" value={summary.week} color="#2563eb" isActive={period === "week"} onClick={() => handlePeriodChange("week")} />
        <SummaryCard label="This Month" value={summary.month} color="#f59e0b" isActive={period === "month"} onClick={() => handlePeriodChange("month")} />
      </div>

  
      <div className="mb-[25px] flex [gap:15px] flex-wrap items-center">
        <PeriodButton active={period === "day"} onClick={() => handlePeriodChange("day")} icon={FaCalendarDay} label="Day" />
        <PeriodButton active={period === "week"} onClick={() => handlePeriodChange("week")} icon={FaCalendarWeek} label="Week" />
        <PeriodButton active={period === "month"} onClick={() => handlePeriodChange("month")} icon={FaCalendarAlt} label="Month" />

        <button onClick={exportCSV} onMouseEnter={e => {
        e.target.style.background = "#096830";
        e.target.style.transform = "translateY(-2px)";
      }} onMouseLeave={e => {
        e.target.style.background = "#0b7a3a";
        e.target.style.transform = "translateY(0)";
      }} className="p-[12px_20px] bg-[#0b7a3a] text-white border-0 rounded-[8px] flex items-center [gap:8px] cursor-pointer text-[15px] font-medium [transition:all_0.2s_ease] ml-[auto]">
          <FaFileCsv size={18} /> Export to Excel
        </button>
      </div>

      
      <div className="bg-white p-[30px] rounded-[12px] [border:1px_solid_#e5e7eb]">
        <h2 className="mb-[25px] text-[20px] font-semibold text-[#374151]">
          Attendance Trend - {period === "day" ? "Last 24 Hours" : period === "week" ? "Last 7 Days" : "Last 30 Days"}
        </h2>

        {trendData.length > 0 ? <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" className="text-[12px]" />
              <YAxis stroke="#6b7280" className="text-[12px]" />
              <Tooltip contentStyle={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 8
          }} />
              <Legend wrapperStyle={{
            fontSize: 14
          }} />
              <Line type="monotone" dataKey="count" stroke="#0b7a3a" strokeWidth={3} name="Number of Visits" dot={{
            fill: "#0b7a3a",
            r: 5
          }} activeDot={{
            r: 7
          }} />
            </LineChart>
          </ResponsiveContainer> : <div className="text-center p-[60px] text-[#9ca3af] text-[16px]">
            No attendance data available for this period
          </div>}
      </div>

   
    </div>;
}



function SummaryCard({
  label,
  value,
  color,
  isActive,
  onClick
}) {
  return <motion.div onClick={onClick} initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: isActive ? 1 : 0.5,
    y: 0,
    scale: isActive ? 1.05 : 1
  }} transition={{
    duration: 0.3
  }} style={{
    cursor: "pointer",
    background: "white",
    padding: 25,
    borderRadius: 12,
    border: isActive ? `3px solid ${color}` : `2px solid ${color}20`,
    borderLeft: `4px solid ${color}`,
    boxShadow: isActive ? `0 8px 16px ${color}30` : "none",
    transform: isActive ? "translateY(-5px)" : "translateY(0)",
    transition: "all 0.3s ease"
  }}>
      <p style={{
      color: isActive ? "#1a202c" : "#6b7280",
      marginBottom: 8,
      fontSize: 14,
      fontWeight: isActive ? 600 : 500
    }}>
        {label}
      </p>
      <h2 style={{
      fontSize: 36,
      margin: 0,
      color: color,
      fontWeight: 700
    }}>
        {value.toLocaleString()}
      </h2>
      {isActive && <motion.div initial={{
      width: 0
    }} animate={{
      width: "100%"
    }} transition={{
      duration: 0.5
    }} style={{
      height: 3,
      background: color,
      marginTop: 12,
      borderRadius: 2
    }} />}
    </motion.div>;
}
function PeriodButton({
  active,
  onClick,
  icon: Icon,
  label
}) {
  return <button onClick={onClick} style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    background: active ? "#0b7a3a" : "white",
    color: active ? "white" : "#374151",
    border: active ? "none" : "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 500,
    transition: "all 0.2s ease"
  }} onMouseEnter={e => {
    if (!active) {
      e.target.style.background = "#f9fafb";
      e.target.style.borderColor = "#9ca3af";
    }
  }} onMouseLeave={e => {
    if (!active) {
      e.target.style.background = "white";
      e.target.style.borderColor = "#d1d5db";
    }
  }}>
      <Icon size={16} /> {label}
    </button>;
}
export default Report;
