import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { FaUserGraduate, FaChalkboardTeacher, FaUsers, FaChartLine, FaSignInAlt, FaSignOutAlt, FaClock, FaQrcode } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CardGridSkeleton, SkeletonBlock } from "../../components/Skeleton";
function LibrarianDashboard() {
  const [todayStats, setTodayStats] = useState({
    students: 0,
    teachers: 0,
    instructors: 0,
    total: 0
  });
  const [timeInOutStats, setTimeInOutStats] = useState({
    timeIn: {
      students: 0,
      teachers: 0,
      instructors: 0
    },
    timeOut: {
      students: 0,
      teachers: 0,
      instructors: 0
    }
  });
  const [recentScans, setRecentScans] = useState([]);
  const [hourlyActivity, setHourlyActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);
  const fetchAllData = async () => {
    try {
      const [statsRes, timeInOutRes, scansRes, hourlyRes] = await Promise.all([api.get("/attendance/today/stats"), api.get("/attendance/today/timein-timeout-stats"), api.get("/attendance/recent?limit=10"), api.get("/attendance/today/hourly")]);
      setTodayStats(statsRes.data);
      setTimeInOutStats(timeInOutRes.data);
      setRecentScans(scansRes.data);
      setHourlyActivity(hourlyRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };
  const totalTimeIn = timeInOutStats.timeIn.students + timeInOutStats.timeIn.teachers + timeInOutStats.timeIn.instructors;
  const totalTimeOut = timeInOutStats.timeOut.students + timeInOutStats.timeOut.teachers + timeInOutStats.timeOut.instructors;
  if (loading) {
    return <div className="min-h-screen bg-[#f5f7fa] p-5">
        <div className="mb-8 space-y-3">
          <SkeletonBlock className="h-9 w-64 max-w-full" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>
        <CardGridSkeleton cards={4} />
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <SkeletonBlock className="h-80 w-full rounded-xl bg-white" />
          <SkeletonBlock className="h-80 w-full rounded-xl bg-white" />
        </div>
      </div>;
  }
  return <div style={{
    padding: isMobile ? '15px' : '20px',
    background: '#f5f7fa',
    minHeight: '100vh'
  }}>
     
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
        fontSize: isMobile ? 24 : 32,
        fontWeight: 700,
        color: '#1a202c',
        marginBottom: 8
      }}>
          Librarian Dashboard
        </h1>
        <p style={{
        color: '#718096',
        fontSize: isMobile ? 14 : 16,
        lineHeight: 1.4
      }}>
          Real-time library attendance monitoring • {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
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
        fontSize: isMobile ? 18 : 20,
        fontWeight: 600,
        color: '#2d3748',
        marginBottom: 15
      }}>
           Today's Visits
        </h2>
        <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: isMobile ? 15 : 20
      }}>
          <VisitCard title="Student Visits" count={todayStats.students} icon={FaUserGraduate} color="#3b82f6" delay={0.1} noShadow isMobile={isMobile} />
          <VisitCard title="Teacher Visits" count={todayStats.teachers} icon={FaChalkboardTeacher} color="#8b5cf6" delay={0.2} noShadow isMobile={isMobile} />
          <VisitCard title="Instructor Visits" count={todayStats.instructors} icon={FaUsers} color="#10b981" delay={0.3} noShadow isMobile={isMobile} />
          <VisitCard title="Total Visits" count={todayStats.total} icon={FaChartLine} color="#f59e0b" delay={0.4} highlight noShadow isMobile={isMobile} />
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
        fontSize: isMobile ? 18 : 20,
        fontWeight: 600,
        color: '#2d3748',
        marginBottom: 15
      }}>
          Current Status
        </h2>
        <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? 15 : 20
      }}>
          <StatusCard title="Currently Inside" subtitle="Time-In without Time-Out" count={totalTimeIn - totalTimeOut} icon={FaSignInAlt} color="#10b981" details={[{
          label: 'Students',
          value: timeInOutStats.timeIn.students - timeInOutStats.timeOut.students
        }, {
          label: 'Teachers',
          value: timeInOutStats.timeIn.teachers - timeInOutStats.timeOut.teachers
        }, {
          label: 'Instructors',
          value: timeInOutStats.timeIn.instructors - timeInOutStats.timeOut.instructors
        }]} delay={0.1} isMobile={isMobile} />
          <StatusCard title="Total Time-Outs" subtitle="Completed visits today" count={totalTimeOut} icon={FaSignOutAlt} color="#ef4444" details={[{
          label: 'Students',
          value: timeInOutStats.timeOut.students
        }, {
          label: 'Teachers',
          value: timeInOutStats.timeOut.teachers
        }, {
          label: 'Instructors',
          value: timeInOutStats.timeOut.instructors
        }]} delay={0.2} isMobile={isMobile} />
        </div>
      </motion.div>

   
      <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))',
      gap: isMobile ? 15 : 20,
      marginBottom: 30
    }}>
  
        <motion.div initial={{
        opacity: 0,
        x: isMobile ? 0 : -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        delay: 0.3
      }} style={{
        background: 'white',
        padding: isMobile ? 15 : 25,
        borderRadius: 16,
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
      }}>
          <div className="flex items-center [gap:10px] mb-[15px]">
            <FaQrcode style={{
            fontSize: isMobile ? 20 : 24,
            color: '#0b7a3a'
          }} />
            <h3 style={{
            fontSize: isMobile ? 16 : 18,
            fontWeight: 600,
            color: '#2d3748',
            margin: 0
          }}>
              Recent Scans
            </h3>
          </div>

          <div style={{
          maxHeight: isMobile ? 300 : 400,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
            {recentScans.length === 0 ? <p className="text-[#a0aec0] [font-style:italic] text-center p-[20px]">
                No scans yet today
              </p> : recentScans.map((scan, idx) => <motion.div key={idx} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: idx * 0.05
          }} style={{
            padding: isMobile ? 12 : 15,
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 8 : 0
          }}>
                  <div className="[flex:1] min-w-[0]">
                    <p style={{
                margin: 0,
                fontWeight: 600,
                color: '#2d3748',
                fontSize: isMobile ? 13 : 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                      {scan.name}
                    </p>
                    <p style={{
                margin: 0,
                color: '#718096',
                fontSize: isMobile ? 11 : 12,
                marginTop: 4
              }}>
                      {scan.id}
                    </p>
                  </div>
                  <div style={{
              textAlign: isMobile ? 'left' : 'right',
              flexShrink: 0
            }}>
                    <p style={{
                margin: 0,
                fontSize: isMobile ? 12 : 13,
                color: scan.timeOut ? '#10b981' : '#f59e0b',
                fontWeight: 600
              }}>
                      {scan.timeOut ? '✓ Time-Out' : '→ Time-In'}
                    </p>
                    <p style={{
                margin: 0,
                color: '#a0aec0',
                fontSize: isMobile ? 10 : 11,
                marginTop: 2
              }}>
                      {new Date(scan.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                    </p>
                  </div>
                </motion.div>)}
          </div>
        </motion.div>

        {/* Today's Activity */}
        <motion.div initial={{
        opacity: 0,
        x: isMobile ? 0 : 20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        delay: 0.3
      }} style={{
        background: 'white',
        padding: isMobile ? 15 : 25,
        borderRadius: 16,
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
      }}>
          <div className="flex items-center [gap:10px] mb-[15px]">
            <FaClock style={{
            fontSize: isMobile ? 20 : 24,
            color: '#0b7a3a'
          }} />
            <h3 style={{
            fontSize: isMobile ? 16 : 18,
            fontWeight: 600,
            color: '#2d3748',
            margin: 0
          }}>
              Today's Hourly Activity
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
            <BarChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#718096" style={{
              fontSize: isMobile ? 9 : 11
            }} tick={{
              fontSize: isMobile ? 9 : 11
            }} />
              <YAxis stroke="#718096" style={{
              fontSize: isMobile ? 9 : 11
            }} tick={{
              fontSize: isMobile ? 9 : 11
            }} />
              <Tooltip contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 10,
              fontSize: isMobile ? 12 : 14
            }} />
              <Bar dataKey="count" fill="#0b7a3a" radius={[8, 8, 0, 0]} name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>;
}
function VisitCard({
  title,
  count,
  icon: Icon,
  color,
  delay,
  highlight,
  noShadow,
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
  }} whileHover={isMobile ? {} : {
    y: -5,
    scale: 1.02
  }} style={{
    background: highlight ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` : 'white',
    padding: isMobile ? 15 : 25,
    borderRadius: 16,
    boxShadow: noShadow ? 'none' : '0 4px 6px rgba(0,0,0,0.07)',
    border: noShadow ? '1px solid #e5e7eb' : 'none',
    borderLeft: highlight ? 'none' : `4px solid ${color}`,
    cursor: 'default',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  }}>
      <div className="flex justify-between items-start relative [z-index:1]">
        <div>
          <p style={{
          margin: 0,
          fontSize: isMobile ? 12 : 14,
          color: highlight ? 'rgba(255,255,255,0.9)' : '#718096',
          fontWeight: 500,
          marginBottom: 8
        }}>
            {title}
          </p>
          <h3 style={{
          margin: 0,
          fontSize: isMobile ? 28 : 36,
          fontWeight: 700,
          color: highlight ? 'white' : '#1a202c'
        }}>
            {count}
          </h3>
        </div>
        <div style={{
        background: highlight ? 'rgba(255,255,255,0.2)' : `${color}15`,
        padding: isMobile ? 8 : 12,
        borderRadius: 12
      }}>
          <Icon style={{
          fontSize: isMobile ? 22 : 28,
          color: highlight ? 'white' : color
        }} />
        </div>
      </div>
    </motion.div>;
}
function StatusCard({
  title,
  subtitle,
  count,
  icon: Icon,
  color,
  details,
  delay,
  isMobile
}) {
  return <motion.div initial={{
    opacity: 0,
    scale: 0.95
  }} animate={{
    opacity: 1,
    scale: 1
  }} transition={{
    delay,
    duration: 0.4
  }} style={{
    background: 'white',
    padding: isMobile ? 15 : 25,
    borderRadius: 16,
    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
    border: `2px solid ${color}20`
  }}>
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: isMobile ? 15 : 20
    }}>
        <div>
          <h3 style={{
          margin: 0,
          fontSize: isMobile ? 16 : 18,
          fontWeight: 600,
          color: '#2d3748',
          marginBottom: 4
        }}>
            {title}
          </h3>
          <p style={{
          margin: 0,
          fontSize: isMobile ? 11 : 12,
          color: '#a0aec0'
        }}>
            {subtitle}
          </p>
        </div>
        <div style={{
        background: `${color}15`,
        padding: isMobile ? 8 : 12,
        borderRadius: 12
      }}>
          <Icon style={{
          fontSize: isMobile ? 20 : 24,
          color
        }} />
        </div>
      </div>

      <h2 style={{
      margin: 0,
      fontSize: isMobile ? 32 : 42,
      fontWeight: 700,
      color,
      marginBottom: isMobile ? 10 : 15
    }}>
        {count}
      </h2>

      <div style={{
      display: 'flex',
      gap: isMobile ? 10 : 15,
      paddingTop: isMobile ? 10 : 15,
      borderTop: '1px solid #e2e8f0',
      flexWrap: 'wrap'
    }}>
        {details.map((detail, idx) => <div key={idx} style={{
        flex: isMobile ? '0 0 calc(33.333% - 7px)' : 1,
        minWidth: isMobile ? '80px' : 'auto'
      }}>
            <p style={{
          margin: 0,
          fontSize: isMobile ? 10 : 11,
          color: '#a0aec0',
          marginBottom: 4
        }}>
              {detail.label}
            </p>
            <p style={{
          margin: 0,
          fontSize: isMobile ? 14 : 18,
          fontWeight: 600,
          color: '#2d3748'
        }}>
              {detail.value}
            </p>
          </div>)}
      </div>
    </motion.div>;
}
export default LibrarianDashboard;
