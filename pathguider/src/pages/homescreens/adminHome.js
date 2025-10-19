import React, { useEffect, useState } from "react";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import "../../App.css";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import PlacementsList from "../../components/PlacementsList";
import Notification from "../../components/Notification";
import Modal from "../../components/Modal";

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminHome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("welcome");
  const [pendingAppeals, setPendingAppeals] = useState([]);
  const [allAppeals, setAllAppeals] = useState([]);
  const [notifications, setNotifications] = useState(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('admin_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortStatus, setSortStatus] = useState('all');

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          navigate("/");
          return;
        }
        setUser(currentUser);
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch placements for analytics
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const response = await fetch('http://localhost:5000/placements');
        const result = await response.json();
        if (response.ok) {
          setPlacements(result.placements || []);
        } else {
          console.error("Failed to fetch placements:", result.message);
        }
      } catch (err) {
        console.error("Error fetching placements:", err);
      }
    };
    if (user) fetchPlacements();
  }, [user]);

  // Fetch appeals and update notifications
  useEffect(() => {
    const fetchAppeals = async () => {
      try {
        const response = await fetch('http://localhost:5000/appeals');
        const result = await response.json();
        if (response.ok) {
          const appeals = result.appeals || [];
          setAllAppeals(appeals);
          const pending = appeals.filter(a => a.status === 'pending');
          setPendingAppeals(pending);
          // Notification logic: add new notification for each new pending appeal
          setNotifications(prev => {
            const prevIds = new Set(prev.map(n => n.appealId));
            const newNotifs = pending
              .filter(a => !prevIds.has(a.id))
              .map(a => ({
                type: 'appeal',
                message: 'New appeal! View in the appeals section.',
                date: a.created_at,
                appealId: a.id,
                studentEmail: a.student_email
              }));
            const updated = [...newNotifs, ...prev].slice(0, 50); // keep last 50
            localStorage.setItem('admin_notifications', JSON.stringify(updated));
            return updated;
          });
        } else {
          console.error("Failed to fetch appeals:", result.message);
          setAllAppeals([]);
          setPendingAppeals([]);
        }
      } catch (err) {
        console.error("Error fetching appeals:", err);
        setAllAppeals([]);
        setPendingAppeals([]);
      }
    };
    if (user) fetchAppeals();
  }, [user, activeSection]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleEditPlacement = async (placement) => {
    const newPathway = window.prompt("Edit pathway (stem, social_sciences, arts):", placement.pathway);
    if (!newPathway || newPathway === placement.pathway) return;

    if (!['stem', 'social_sciences', 'arts'].includes(newPathway)) {
      alert("Invalid pathway. Must be: stem, social_sciences, or arts");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/placements/${placement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathway: newPathway }),
      });

      if (response.ok) {
        alert("Placement updated successfully!");
        // Refresh placements
        const result = await fetch('http://localhost:5000/placements');
        const data = await result.json();
        if (result.ok) setPlacements(data.placements || []);
      } else {
        const error = await response.json();
        alert(`Failed to update placement: ${error.message}`);
      }
    } catch (err) {
      console.error("Error updating placement:", err);
      alert("Failed to update placement");
    }
  };

  const handleAppealStatusChange = async (appealId, newStatus) => {
    if (newStatus === 'rejected') {
      setShowRejectionModal(true);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/appeal_status/${appealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedAppeal({ ...selectedAppeal, status: newStatus });
        
        // Refresh appeals list
        const appealsResponse = await fetch('http://localhost:5000/appeals');
        const appealsData = await appealsResponse.json();
        if (appealsResponse.ok) {
          const appeals = appealsData.appeals || [];
          setAllAppeals(appeals);
          setPendingAppeals(appeals.filter(a => a.status === 'pending'));
        }

        if (newStatus === 'approved') {
          alert("Appeal approved! Placement updated.");
          setSelectedAppeal(null);
          setActiveSection('placements');
        }
      } else {
        const error = await response.json();
        alert(`Failed to update appeal: ${error.message}`);
      }
    } catch (err) {
      console.error("Error updating appeal:", err);
      alert("Failed to update appeal status");
    }
  };

  const handleRejectAppeal = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/appeal_status/${selectedAppeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'rejected', 
          rejection_reason: rejectionReason 
        })
      });

      if (response.ok) {
        alert("Appeal rejected");
        setShowRejectionModal(false);
        setSelectedAppeal(null);
        setRejectionReason("");
        
        // Refresh appeals
        const appealsResponse = await fetch('http://localhost:5000/appeals');
        const appealsData = await appealsResponse.json();
        if (appealsResponse.ok) {
          const appeals = appealsData.appeals || [];
          setAllAppeals(appeals);
          setPendingAppeals(appeals.filter(a => a.status === 'pending'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to reject appeal: ${error.message}`);
      }
    } catch (err) {
      console.error("Error rejecting appeal:", err);
      alert("Failed to reject appeal");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, color: '#603bbb', marginBottom: 16 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarOpen((v) => !v)} 
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '⏴' : '⏵'}
        </button>
        <div className="sidebar-header">
          {sidebarOpen ? 'PathGuider Administrator' : 'PG'}
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-link ${activeSection === 'welcome' ? 'active' : ''}`}
            onClick={() => setActiveSection("welcome")}
          >
            {sidebarOpen ? 'Home' : '🏠'}
          </button>
          <button 
            className={`sidebar-link ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection("notifications")}
          >
            {sidebarOpen ? (
              <>
                Notifications
                {pendingAppeals.length > 0 && (
                  <span style={{
                    marginLeft: 8,
                    background: '#ff4b6e',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '2px 10px',
                    fontSize: 14,
                    fontWeight: 700
                  }}>
                    New!
                  </span>
                )}
              </>
            ) : (
              <>
                🔔
                {pendingAppeals.length > 0 && (
                  <span style={{
                    marginLeft: 4,
                    background: '#ff4b6e',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '2px 7px',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'inline-block',
                    minWidth: 20,
                    textAlign: 'center'
                  }}>
                    {pendingAppeals.length}
                  </span>
                )}
              </>
            )}
          </button>
          <button 
            className={`sidebar-link ${activeSection === 'appeals' ? 'active' : ''}`}
            onClick={() => setActiveSection("appeals")}
          >
            {sidebarOpen ? 'Appeals' : '📄'}
          </button>
          <button 
            className={`sidebar-link ${activeSection === 'placements' ? 'active' : ''}`}
            onClick={() => setActiveSection("placements")}
          >
            {sidebarOpen ? 'View All Placements' : '🗂️'}
          </button>
          <button 
            className={`sidebar-link ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection("profile")}
          >
            {sidebarOpen ? 'Profile' : '👤'}
          </button>
          <button 
            className={`sidebar-link ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection("settings")}
          >
            {sidebarOpen ? 'Settings' : '⚙️'}
          </button>
          <button 
            className="sidebar-link"
            onClick={handleLogout}
            style={{ marginTop: 'auto' }}
          >
            {sidebarOpen ? 'Log Out' : '🚪'}
          </button>
        </nav>
      </aside>

      <main className="admin-main-content">
        {activeSection === "welcome" && (
          <>
            <div className="admin-welcome">
              Welcome, Administrator! Here you can view system analytics.
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "18px",
                marginTop: "20px",
                alignItems: "stretch",
                justifyItems: "center",
              }}
            >
              {/* Total Students Placed */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(96,59,187,0.08)",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <h3 style={{ color: "#603bbb", fontSize: 15, marginBottom: 8 }}>
                  Total Students Placed
                </h3>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#603bbb",
                    margin: "8px 0",
                  }}
                >
                  {placements.length}
                </div>
              </div>

              {/* Pathway Comparison Bar Chart */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(96,59,187,0.08)",
                  padding: 16,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h3 style={{ color: "#603bbb", fontSize: 15, marginBottom: 8 }}>
                  Pathway Comparison
                </h3>
                <div style={{ height: 180, width: "100%" }}>
                  <Bar
                    data={{
                      labels: ["STEM", "Social Sciences", "Arts"],
                      datasets: [
                        {
                          label: "Number of Students",
                          data: [
                            placements.filter((p) => p.pathway === "stem").length,
                            placements.filter((p) => p.pathway === "social_sciences").length,
                            placements.filter((p) => p.pathway === "arts").length,
                          ],
                          backgroundColor: ["#3b82f6", "#f59e42", "#e34a6f"],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { stepSize: 1 },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Gender Comparison Pie Chart */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(96,59,187,0.08)",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h3 style={{ color: "#603bbb", fontSize: 15, marginBottom: 8 }}>
                  Gender Comparison
                </h3>
                <div style={{ height: 180, width: "100%" }}>
                  {(() => {
                    // Get all unique gender values (case-insensitive, fallback to 'Not Specified')
                    const genderCounts = {};
                    placements.forEach(p => {
                      let g = (p.gender || 'Not Specified').trim();
                      if (!g) g = 'Not Specified';
                      g = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
                      genderCounts[g] = (genderCounts[g] || 0) + 1;
                    });
                    const genderLabels = Object.keys(genderCounts);
                    const genderData = genderLabels.map(l => genderCounts[l]);
                    const genderColors = [
                      '#3b82f6', '#e34a6f', '#f59e42', '#8e44ad', '#16a085', '#f39c12', '#2ecc71', '#c0392b', '#34495e', '#95a5a6'
                    ];
                    return (
                      <Pie
                        data={{
                          labels: genderLabels,
                          datasets: [{
                            data: genderData,
                            backgroundColor: genderColors.slice(0, genderLabels.length),
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: "bottom" } },
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Gender per Placement Bar Graphs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '18px',
              marginTop: '32px',
              alignItems: 'stretch',
              justifyItems: 'center',
            }}>
              {['stem', 'arts', 'social_sciences'].map((pathway, idx) => {
                // Get all unique gender values for this pathway
                const genderCounts = {};
                placements.filter(p => p.pathway === pathway).forEach(p => {
                  let g = (p.gender || 'Not Specified').trim();
                  if (!g) g = 'Not Specified';
                  g = g.charAt(0).toUpperCase() + g.slice(1).toLowerCase();
                  genderCounts[g] = (genderCounts[g] || 0) + 1;
                });
                const genderLabels = Object.keys(genderCounts);
                const genderData = genderLabels.map(l => genderCounts[l]);
                const genderColors = [
                  '#3b82f6', '#e34a6f', '#f59e42', '#8e44ad', '#16a085', '#f39c12', '#2ecc71', '#c0392b', '#34495e', '#95a5a6'
                ];
                const pathwayNames = {
                  'stem': 'STEM',
                  'arts': 'Arts',
                  'social_sciences': 'Social Sciences'
                };
                return (
                  <div key={pathway} style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(96,59,187,0.08)', padding: 16, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ color: '#603bbb', fontSize: 15, marginBottom: 8 }}>{pathwayNames[pathway]}: Gender Distribution</h3>
                    <div style={{ height: 180, width: '100%' }}>
                      <Bar
                        data={{
                          labels: genderLabels,
                          datasets: [{
                            label: 'Number of Students',
                            data: genderData,
                            backgroundColor: genderColors.slice(0, genderLabels.length),
                          }],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { stepSize: 1 },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeSection === "notifications" && (
          <div>
            <h2 style={{ color: '#603bbb', marginBottom: 24 }}>Notifications</h2>
            {notifications.length === 0 ? (
              <div style={{ 
                color: '#888', 
                padding: 32, 
                textAlign: 'center',
                background: '#f7f7fa',
                borderRadius: 8
              }}>
                No notifications yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {notifications.map((notif, idx) => (
                  <div key={notif.appealId + '-' + idx} style={{ background: '#f7f7fa', borderRadius: 8, padding: 16, color: '#603bbb', fontWeight: 500, boxShadow: '0 1px 4px rgba(96,59,187,0.05)' }}>
                    <div>{notif.message}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Appeal from: {notif.studentEmail || 'Unknown'} | {new Date(notif.date).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === "placements" && (
          <PlacementsList isAdmin={true} onEdit={handleEditPlacement} />
        )}

        {activeSection === "appeals" && (
          <div>
            <h2 style={{ color: '#603bbb', marginBottom: 24 }}>All Appeals</h2>
            {/* Sort by status dropdown */}
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#603bbb', fontWeight: 500 }}>Sort by status:</span>
              <select
                value={sortStatus}
                onChange={e => setSortStatus(e.target.value)}
                style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {(() => {
              // Add sort/filter logic
              let filteredAppeals = allAppeals;
              if (sortStatus !== 'all') {
                filteredAppeals = allAppeals.filter(a => a.status === sortStatus);
              }
              // Sort by timestamp descending (most recent first)
              filteredAppeals = [...filteredAppeals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              return filteredAppeals.length === 0 ? (
                <div style={{ 
                  color: '#888', 
                  padding: 32, 
                  textAlign: 'center',
                  background: '#f7f7fa',
                  borderRadius: 8
                }}>
                  No appeals found.
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 12, color: '#666' }}>
                    Click an appeal to view details and take action.
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      borderCollapse: 'collapse',
                      width: '100%',
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
                    }}>
                      <thead>
                        <tr style={{ background: '#603bbb', color: '#fff' }}>
                          <th style={{ padding: '12px 18px', textAlign: 'left' }}>#</th>
                          <th style={{ padding: '12px 18px', textAlign: 'left' }}>Student Email</th>
                          <th style={{ padding: '12px 18px', textAlign: 'left' }}>Appeal Text</th>
                          <th style={{ padding: '12px 18px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '12px 18px', textAlign: 'left' }}>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppeals.map((appeal, index) => (
                          <tr 
                            key={appeal.id} 
                            style={{ 
                              cursor: 'pointer',
                              background: index % 2 === 0 ? '#f7f7fa' : '#fff'
                            }}
                            onClick={() => setSelectedAppeal(appeal)}
                          >
                            <td style={{ 
                              padding: '10px 16px', 
                              borderBottom: '1px solid #eee', 
                              color: '#603bbb',
                              fontWeight: 600
                            }}>
                              {index + 1}
                            </td>
                            <td style={{ 
                              padding: '10px 16px', 
                              borderBottom: '1px solid #eee', 
                              color: '#222' 
                            }}>
                              {appeal.student_email}
                            </td>
                            <td style={{ 
                              padding: '10px 16px', 
                              borderBottom: '1px solid #eee', 
                              color: '#222',
                              maxWidth: 320,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {appeal.appeal_text}
                            </td>
                            <td style={{ 
                              padding: '10px 16px', 
                              borderBottom: '1px solid #eee'
                            }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: 12,
                                fontSize: 13,
                                fontWeight: 600,
                                background: appeal.status === 'pending' ? '#fff3cd' :
                                           appeal.status === 'approved' ? '#d4edda' : '#f8d7da',
                                color: appeal.status === 'pending' ? '#856404' :
                                       appeal.status === 'approved' ? '#155724' : '#721c24'
                              }}>
                                {appeal.status}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '10px 16px', 
                              borderBottom: '1px solid #eee', 
                              color: '#222' 
                            }}>
                              {new Date(appeal.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Appeal Details Modal */}
                  <Modal 
                    open={!!selectedAppeal} 
                    title="Appeal Details" 
                    onClose={() => setSelectedAppeal(null)}
                  >
                    {selectedAppeal && (
                      <div style={{ color: '#603bbb' }}>
                        <div style={{ marginBottom: 12 }}>
                          <b>Student Email:</b> {selectedAppeal.student_email}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <b>Appeal Text:</b> 
                          <div style={{ 
                            marginTop: 8,
                            padding: 12,
                            background: '#f7f7fa',
                            borderRadius: 6,
                            color: '#333'
                          }}>
                            {selectedAppeal.appeal_text}
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <b>Status:</b>
                          <select
                            value={selectedAppeal.status}
                            onChange={(e) => handleAppealStatusChange(selectedAppeal.id, e.target.value)}
                            style={{
                              padding: 8,
                              borderRadius: 6,
                              border: '1px solid #ccc',
                              marginLeft: 8
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approve</option>
                            <option value="rejected">Reject</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <b>Created At:</b> {new Date(selectedAppeal.created_at).toLocaleString()}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          gap: 12, 
                          marginTop: 24 
                        }}>
                          <button 
                            onClick={() => setSelectedAppeal(null)} 
                            style={{
                              padding: '8px 18px',
                              background: '#888',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer'
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </Modal>

                  {/* Rejection Reason Modal */}
                  <Modal 
                    open={showRejectionModal} 
                    title="Rejection Reason" 
                    onClose={() => {
                      setShowRejectionModal(false);
                      setRejectionReason("");
                    }}
                  >
                    <div style={{ marginBottom: 16 }}>
                      Please provide a reason for rejecting this appeal:
                    </div>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={4}
                      placeholder="Enter rejection reason..."
                      style={{
                        width: '100%',
                        padding: 10,
                        borderRadius: 6,
                        border: '1px solid #ccc',
                        marginBottom: 18,
                        fontFamily: 'inherit',
                        fontSize: 14
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button 
                        onClick={() => {
                          setShowRejectionModal(false);
                          setRejectionReason("");
                        }}
                        style={{
                          padding: '8px 18px',
                          background: '#888',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRejectAppeal}
                        style={{
                          padding: '8px 18px',
                          background: '#d32f2f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed',
                          opacity: rejectionReason.trim() ? 1 : 0.5
                        }}
                        disabled={!rejectionReason.trim()}
                      >
                        Submit Reason
                      </button>
                    </div>
                  </Modal>
                </div>
              );
            })()}
          </div>
        )}

        {activeSection === "profile" && (
          <div>
            <h2 style={{ color: '#603bbb', marginBottom: 24 }}>Profile</h2>
            <div style={{ 
              background: '#fff', 
              padding: 24, 
              borderRadius: 8,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
            }}>
              <p><b>Email:</b> {user.email}</p>
              <p><b>Role:</b> Administrator</p>
            </div>
          </div>
        )}

        {activeSection === "settings" && (
          <div>
            <h2 style={{ color: '#603bbb', marginBottom: 24 }}>Settings</h2>
            <div style={{ 
              background: '#fff', 
              padding: 24, 
              borderRadius: 8,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)'
            }}>
              <p>Settings coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminHome;