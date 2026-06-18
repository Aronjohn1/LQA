import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { FaUserGraduate, FaChalkboardTeacher, FaUsers, FaChartLine, FaCalendarAlt, FaCalendarWeek, FaCalendarDay } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CardGridSkeleton, SkeletonBlock } from '../../components/Skeleton';
function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCounts, setTotalCounts] = useState({
    students: 0,
    teachers: 0,
    instructors: 0,
    admins: 0
  });
  const [todayStats, setTodayStats] = useState({
    students: 0,
    teachers: 0,
    instructors: 0,
    total: 0
  });
  const [trendData, setTrendData] = useState([]);
  const [period, setPeriod] = useState('week');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [protectedRes, countsRes, statsRes, trendRes] = await Promise.all([api.get('/protected'), api.get('/user/counts'), api.get('/attendance/today/stats'), api.get('/attendance/trend?days=7')]);
        if (!mounted) return;
        setUser(protectedRes.data.user || null);
        setTotalCounts(countsRes.data);
        setTodayStats(statsRes.data);
        setTrendData(trendRes.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(() => {
      api.get('/attendance/today/stats').then(res => setTodayStats(res.data));
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [navigate]);
  const handlePeriodChange = async newPeriod => {
    setPeriod(newPeriod);
    const days = newPeriod === 'day' ? 1 : newPeriod === 'week' ? 7 : 30;
    try {
      const res = await api.get(`/attendance/trend?days=${days}`);
      setTrendData(res.data);
    } catch (err) {
      console.error('Failed to fetch trend:', err);
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fa] p-5">
        <div className="mb-8 space-y-3">
          <SkeletonBlock className="h-9 w-64 max-w-full" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>
        <CardGridSkeleton cards={4} />
        <div className="mt-8 rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <SkeletonBlock className="mb-5 h-6 w-48" />
          <SkeletonBlock className="h-72 w-full" />
        </div>
      </div>;
  }
  return <div style={{
    padding: isMobile ? '10px' : '20px',
    background: '#f5f7fa',
    minHeight: '100vh'
  }}>
      {/* Header */}
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} style={{
      marginBottom: isMobile ? 20 : 30
    }}>
        <h1 style={{
        fontSize: isMobile ? 22 : isTablet ? 28 : 32,
        fontWeight: 700,
        color: '#1a202c',
        marginBottom: 8
      }}>
          {isMobile ? 'Dashboard' : 'Admin Dashboard'}
        </h1>
        <p style={{
        color: '#718096',
        fontSize: isMobile ? 12 : isTablet ? 14 : 16,
        maxWidth: '600px'
      }}>
          Welcome back, {user?.name || 'Admin'}! Here's what's happening today.
        </p>
      </motion.div>

  
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.1
    }} style={{
      marginBottom: isMobile ? 20 : 30
    }}>
        <h2 style={{
        fontSize: isMobile ? 16 : 18,
        fontWeight: 600,
        color: '#2d3748',
        marginBottom: isMobile ? 10 : 15
      }}>
          Today's Attendance
        </h2>
        <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 12 : 20
      }}>
          <SimpleCard title="Student Visits" count={todayStats.students} icon={FaUserGraduate} color="#3b82f6" delay={0.1} isMobile={isMobile} />
          <SimpleCard title="Teacher Visits" count={todayStats.teachers} icon={FaChalkboardTeacher} color="#8b5cf6" delay={0.2} isMobile={isMobile} />
          <SimpleCard title="Instructor Visits" count={todayStats.instructors} icon={FaUsers} color="#10b981" delay={0.3} isMobile={isMobile} />
          <SimpleCard title="Total Visits" count={todayStats.total} icon={FaChartLine} color="#f59e0b" delay={0.4} isMobile={isMobile} />
        </div>
      </motion.div>

     
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.2
    }} style={{
      marginBottom: isMobile ? 20 : 30
    }}>
        <h2 style={{
        fontSize: isMobile ? 16 : 18,
        fontWeight: 600,
        color: '#2d3748',
        marginBottom: isMobile ? 10 : 15
      }}>
          Total Registered Users
        </h2>
        <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? 12 : 20
      }}>
          <TotalCard title="Students" count={totalCounts.students} icon={FaUserGraduate} color="#06b6d4" delay={0.1} isMobile={isMobile} />
          <TotalCard title="Teachers" count={totalCounts.teachers} icon={FaChalkboardTeacher} color="#ec4899" delay={0.2} isMobile={isMobile} />
          <TotalCard title="Instructors" count={totalCounts.instructors} icon={FaUsers} color="#14b8a6" delay={0.3} isMobile={isMobile} />
        </div>
      </motion.div>

      {/* Attendance Trend Graph */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.3
    }} style={{
      background: 'white',
      padding: isMobile ? 15 : 25,
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      marginBottom: isMobile ? 20 : 30
    }}>
        <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 15 : 0,
        marginBottom: isMobile ? 15 : 25
      }}>
          <h2 style={{
          fontSize: isMobile ? 16 : 18,
          fontWeight: 600,
          color: '#2d3748',
          margin: 0
        }}>
            Attendance Trend
          </h2>
          
          <div style={{
          display: 'flex',
          gap: isMobile ? 8 : 10,
          justifyContent: isMobile ? 'center' : 'flex-end'
        }}>
            <PeriodButton active={period === 'day'} onClick={() => handlePeriodChange('day')} icon={FaCalendarDay} label={isMobile ? "D" : "Day"} isMobile={isMobile} />
            <PeriodButton active={period === 'week'} onClick={() => handlePeriodChange('week')} icon={FaCalendarWeek} label={isMobile ? "W" : "Week"} isMobile={isMobile} />
            <PeriodButton active={period === 'month'} onClick={() => handlePeriodChange('month')} icon={FaCalendarAlt} label={isMobile ? "M" : "Month"} isMobile={isMobile} />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={isMobile ? 250 : isTablet ? 300 : 350}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#64748b" style={{
            fontSize: isMobile ? 10 : 12
          }} />
            <YAxis stroke="#64748b" style={{
            fontSize: isMobile ? 10 : 12
          }} />
            <Tooltip contentStyle={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 10,
            fontSize: isMobile ? 12 : 14
          }} />
            <Legend wrapperStyle={{
            fontSize: isMobile ? 12 : 14,
            paddingTop: isMobile ? 5 : 10
          }} />
            <Line type="monotone" dataKey="count" stroke="#0b7a3a" strokeWidth={isMobile ? 2 : 3} dot={{
            fill: '#0b7a3a',
            r: isMobile ? 3 : 5
          }} activeDot={{
            r: isMobile ? 5 : 7
          }} name="Total Visits" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      
    </div>;
}
function SimpleCard({
  title,
  count,
  icon: Icon,
  color,
  delay,
  isMobile
}) {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    delay,
    duration: 0.4
  }} style={{
    background: 'white',
    padding: isMobile ? 15 : 20,
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    cursor: 'default',
    transition: 'all 0.2s ease',
    minHeight: 'auto',
    display: 'flex',
    flexDirection: 'column'
  }}>
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isMobile ? 8 : 12
    }}>
        <div className="[flex:1]">
          <p style={{
          margin: 0,
          fontSize: isMobile ? 12 : 14,
          color: '#64748b',
          fontWeight: 500,
          marginBottom: isMobile ? 4 : 6
        }}>
            {title}
          </p>
          <h3 style={{
          margin: 0,
          fontSize: isMobile ? 24 : 28,
          fontWeight: 700,
          color: '#1e293b'
        }}>
            {count}
          </h3>
        </div>
        <div style={{
        background: `${color}15`,
        padding: isMobile ? 6 : 8,
        borderRadius: 8,
        flexShrink: 0,
        marginLeft: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
          <Icon style={{
          fontSize: isMobile ? 18 : 22,
          color
        }} />
        </div>
      </div>
    </motion.div>;
}
function TotalCard({
  title,
  count,
  icon: Icon,
  color,
  delay,
  isMobile
}) {
  return <motion.div initial={{
    opacity: 0,
    scale: 0.9
  }} animate={{
    opacity: 1,
    scale: 1
  }} transition={{
    delay,
    duration: 0.4
  }} style={{
    background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
    padding: isMobile ? 15 : 20,
    borderRadius: 10,
    border: `2px solid ${color}30`,
    cursor: 'default',
    transition: 'all 0.2s ease',
    minHeight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }}>
      <div className="flex justify-between items-center">
        <div>
          <p style={{
          margin: 0,
          fontSize: isMobile ? 12 : 14,
          color: '#64748b',
          fontWeight: 500,
          marginBottom: isMobile ? 4 : 6
        }}>
            {title}
          </p>
          <h3 style={{
          margin: 0,
          fontSize: isMobile ? 24 : 28,
          fontWeight: 700,
          color
        }}>
            {count}
          </h3>
        </div>
        <Icon style={{
        fontSize: isMobile ? 28 : 34,
        color: `${color}80`,
        opacity: 0.8
      }} />
      </div>
    </motion.div>;
}
function PeriodButton({
  active,
  onClick,
  icon: Icon,
  label,
  isMobile
}) {
  return <button onClick={onClick} style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? 4 : 6,
    padding: isMobile ? '8px 12px' : '8px 16px',
    background: active ? '#0b7a3a' : 'white',
    color: active ? 'white' : '#64748b',
    border: active ? '1px solid #0b7a3a' : '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: isMobile ? 12 : 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: isMobile ? 'auto' : '80px'
  }}>
      <Icon size={isMobile ? 12 : 14} />
      {label}
    </button>;
}
export default AdminDashboard;
