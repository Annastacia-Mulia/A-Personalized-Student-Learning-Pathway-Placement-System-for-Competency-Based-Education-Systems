import React, { useEffect, useState } from "react";
import "../../App.css";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import SettingsPage from "../SettingsPage"; // Import the SettingsPage component

const StudentHome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [loadingPlacement, setLoadingPlacement] = useState(true);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealText, setAppealText] = useState("");
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState("");
  const [appealError, setAppealError] = useState("");
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('student_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [hasUnseen, setHasUnseen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  // Mark notifications as seen when notifications page is opened
  useEffect(() => {
    if (activeSection === 'notifications' && notifications.some(n => !n.seen)) {
      const updated = notifications.map(n => ({ ...n, seen: true }));
      setNotifications(updated);
      localStorage.setItem('student_notifications', JSON.stringify(updated));
      setHasUnseen(false);
    }
  }, [activeSection, notifications]);
  // Fetch student appeals for notifications
  useEffect(() => {
    const fetchStudentAppeals = async () => {
      if (!user) return;
      try {
        const response = await fetch('http://localhost:5000/appeals');
        const result = await response.json();
        if (response.ok) {
          const appeals = (result.appeals || []).filter(a => a.student_email === user.email);
          setNotifications(prev => {
            const prevIds = new Set(prev.map(n => n.appealId + '-' + n.status));
            const newNotifs = appeals
              .filter(a => a.status !== 'pending')
              .filter(a => !prevIds.has(a.id + '-' + a.status))
              .map(a => ({
                type: 'appeal',
                message: `Your appeal was ${a.status}${a.status === 'rejected' && a.rejection_reason ? ': ' + a.rejection_reason : ''}`,
                date: a.updated_at || a.created_at,
                appealId: a.id,
                status: a.status,
                seen: false
              }));
            if (newNotifs.length === 0) {
              // No new notifications, don't update state or localStorage
              return prev;
            }
            const updated = [...newNotifs, ...prev].slice(0, 50);
            localStorage.setItem('student_notifications', JSON.stringify(updated));
            setHasUnseen(updated.some(n => !n.seen));
            return updated;
          });
        }
      } catch (err) {}
    };
    fetchStudentAppeals();
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (!currentUser) {
        navigate("/");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchPlacement = async () => {
      if (!user) return;
      setLoadingPlacement(true);
      // Assuming placements are stored in 'student_pathways' table with email
      const { data, error } = await supabase
        .from("student_pathways")
        .select("id, pathway, stem, social_sciences, arts")
        .eq("email", user.email)
        .single();
      if (error) {
        setPlacement(null);
      } else {
        setPlacement(data);
      }
      setLoadingPlacement(false);
    };
    if (user) fetchPlacement();
  }, [user]);

  const handleLogout = () => {
    supabase.auth.signOut()
      .then(() => navigate("/"))
      .catch((err) => console.error("Logout error:", err));
  };

  const handleAppealSubmit = async () => {
    setAppealLoading(true);
    setAppealError("");
    setAppealSuccess("");
    try {
      const response = await fetch('http://localhost:5000/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_email: user.email,
          appeal_text: appealText,
          placement_id: placement?.id || null
        })
      });
      const result = await response.json();
      if (response.ok) {
        setAppealSuccess(result.message || "Your appeal has been submitted.");
        setShowAppealModal(false);
        setAppealText("");
      } else {
        setAppealError(result.message || "Failed to submit appeal. Please try again.");
      }
    } catch (error) {
      setAppealError("Failed to submit appeal. Please try again.");
    }
    setAppealLoading(false);
  };

  if (!user) {
    return <div style={{textAlign:'center',marginTop:'2rem'}}>Loading...</div>;
  }

  return (
    <div className="home-page" style={{display:'flex',minHeight:'100vh',alignItems:'stretch'}}>
      {/* Sidebar */}
      <aside style={{width:220,background:'#603bbb',color:'#fff',padding:'32px 0',display:'flex',flexDirection:'column',alignItems:'center',boxShadow:'2px 0 16px rgba(96,59,187,0.08)',height:'100vh',position:'fixed',top:0,left:0,zIndex:100}}>
        <h2 style={{marginBottom:32,fontWeight:800,letterSpacing:1.2}}>Student Menu</h2>
        <nav style={{display:'flex',flexDirection:'column',gap:18,width:'100%',alignItems:'center'}}>
          <button
            style={{
              background: activeSection === 'home' ? '#fff' : 'none',
              color: activeSection === 'home' ? '#603bbb' : '#fff',
              border: 'none',
              fontSize: 18,
              padding: '12px 0',
              width: '80%',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 8,
              boxShadow: activeSection === 'home' ? '0 2px 8px rgba(96,59,187,0.10)' : 'none',
              transition: 'background 0.2s, color 0.2s'
            }}
            onClick={() => setActiveSection('home')}
          >
            Home
          </button>
          <button
            style={{
              background: activeSection === 'profile' ? '#fff' : 'none',
              color: activeSection === 'profile' ? '#603bbb' : '#fff',
              border: 'none',
              fontSize: 18,
              padding: '12px 0',
              width: '80%',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 8,
              boxShadow: activeSection === 'profile' ? '0 2px 8px rgba(96,59,187,0.10)' : 'none',
              transition: 'background 0.2s, color 0.2s'
            }}
            onClick={() => setActiveSection('profile')}
          >
            My Profile
          </button>
          <button
            style={{
              background: activeSection === 'placements' ? '#fff' : 'none',
              color: activeSection === 'placements' ? '#603bbb' : '#fff',
              border: 'none',
              fontSize: 18,
              padding: '12px 0',
              width: '80%',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 8,
              boxShadow: activeSection === 'placements' ? '0 2px 8px rgba(96,59,187,0.10)' : 'none',
              transition: 'background 0.2s, color 0.2s'
            }}
            onClick={() => setActiveSection('placements')}
          >
            My Placements
          </button>
          <button
            style={{
              background: activeSection === 'appeals' ? '#fff' : 'none',
              color: activeSection === 'appeals' ? '#603bbb' : '#fff',
              border: 'none',
              fontSize: 18,
              padding: '12px 0',
              width: '80%',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 8,
              boxShadow: activeSection === 'appeals' ? '0 2px 8px rgba(96,59,187,0.10)' : 'none',
              transition: 'background 0.2s, color 0.2s'
            }}
            onClick={() => setActiveSection('appeals')}
          >
            My Appeals
          </button>
          <button style={{color:'#ffffff',border:'none',fontSize:18,padding:'12px 0',width:'80%',borderRadius:8,cursor:'pointer',fontWeight:700,marginBottom:8}} onClick={() => setShowAppealModal(true)}>
            Make Appeal
          </button>
          <button
            style={{
              background: activeSection === 'notifications' ? '#fff' : 'none',
              color: activeSection === 'notifications' ? '#603bbb' : '#fff',
              border: 'none',
              fontSize: 18,
              padding: '12px 0',
              width: '80%',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 8,
              position: 'relative',
              boxShadow: activeSection === 'notifications' ? '0 2px 8px rgba(96,59,187,0.10)' : 'none',
              transition: 'background 0.2s, color 0.2s'
            }}
            onClick={() => setActiveSection('notifications')}
          >
            Notifications
            {hasUnseen && (() => {
              const newCount = notifications.filter(n => !n.seen).length;
              return newCount > 0 ? (
                <span style={{
                  position: 'absolute',
                  right: 18,
                  top: 8,
                  background: '#ff4b6e',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '2px 10px',
                  fontSize: 14,
                  fontWeight: 700
                }}>
                  {newCount}
                </span>
              ) : null;
            })()}
          </button>
          <button
            style={{
              background: activeSection === 'settings' ? '#fff' : 'none',
              color: activeSection === 'settings' ? '#603bbb' : '#fff',
              border: 'none',
              fontSize: 18,
              padding: '12px 0',
              width: '80%',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 8,
              boxShadow: activeSection === 'settings' ? '0 2px 8px rgba(96,59,187,0.10)' : 'none',
              transition: 'background 0.2s, color 0.2s'
            }}
            onClick={() => setActiveSection('settings')}
          >
            Settings
          </button>
        </nav>
      </aside>

      {/* Main content beside sidebar */}
      <div style={{flex:1,marginLeft:220}}>
        <nav className="home-nav">
          <h2>Student Dashboard</h2>
          <button onClick={handleLogout}>Log Out</button>
        </nav>

        {activeSection === 'home' && (
          <div className="home-content">
            <p>Welcome, Student! In your dashboard you can view your pathway placement.</p>
            <div style={{marginTop:32,background:'#fff',color:'#603bbb',borderRadius:12,padding:24,maxWidth:480,margin:'32px auto',boxShadow:'0 2px 12px rgba(96,59,187,0.10)'}}>
              <h3 style={{marginBottom:18}}>Your Placement</h3>
              {loadingPlacement ? (
                <div>Loading placement...</div>
              ) : placement ? (
                <div>
                  <div><b>Pathway:</b> {placement.pathway ? placement.pathway.toUpperCase() : ''}</div>
                  <div><b>STEM:</b> {placement.stem}</div>
                  <div><b>Social Sciences:</b> {placement.social_sciences}</div>
                  <div><b>Arts:</b> {placement.arts}</div>
                  <button style={{marginTop:18,padding:'10px 28px',background:'#603bbb',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}} onClick={() => setShowAppealModal(true)}>
                    Appeal Placement
                  </button>
                </div>
              ) : (
                <div>You haven't been placed yet. Check back soon!</div>
              )}
              {appealSuccess && <div style={{color:'green',marginTop:16}}>{appealSuccess}</div>}
              {appealError && <div style={{color:'red',marginTop:16}}>{appealError}</div>}
            </div>
            <p> In case you are not satisfied with your placement, you can make an appeal.</p>
            <p> It will be reviewed and potentially adjusted based on your feedback.</p>
          </div>
        )}

        {activeSection === 'profile' && (
          <div style={{
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(96,59,187,0.08)',
            padding: 32,
            margin: 32,
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
            minHeight: 180,
            color: '#603bbb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h2 style={{ fontWeight: 700, marginBottom: 18 }}>My Profile</h2>
            <div style={{ fontSize: 16, marginBottom: 8 }}><b>Name:</b> {user?.user_metadata?.first_name || ''} {user?.user_metadata?.last_name || ''}</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}><b>Email:</b> {user?.email}</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}><b>Pathway:</b> {placement?.pathway ? placement.pathway.toUpperCase() : 'N/A'}</div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div style={{
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(96,59,187,0.08)',
            padding: 32,
            margin: 32,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            minHeight: 300
          }}>
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
              <ol style={{ paddingLeft: 24, margin: 0 }}>
                {[...notifications].sort((a, b) => new Date(b.date) - new Date(a.date)).map((notif, idx) => (
                  <li key={notif.appealId + '-' + idx} style={{ background: '#f7f7fa', borderRadius: 8, padding: 16, color: '#603bbb', fontWeight: 500, boxShadow: '0 1px 4px rgba(96,59,187,0.05)', marginBottom: 12 }}>
                    <div>{notif.message}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{new Date(notif.date).toLocaleString()}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {activeSection === 'settings' && (
          <SettingsPage user={user} role="student" />
        )}

        {/* Appeal Modal */}
        <Modal open={showAppealModal} title="Appeal Placement" onClose={() => setShowAppealModal(false)}>
          <div style={{marginBottom:16}}>Select your desired pathway and explain why you want your placement changed:</div>
          <select
            value={placement?.desired_pathway || ''}
            onChange={e => setPlacement({ ...placement, desired_pathway: e.target.value })}
            style={{width:'100%',padding:10,borderRadius:6,border:'1px solid #ccc',marginBottom:12}}
            disabled={appealLoading}
          >
            <option value="">Select desired pathway</option>
            <option value="STEM">STEM</option>
            <option value="SOCIAL_SCIENCES">SOCIAL SCIENCES</option>
            <option value="ARTS">ARTS</option>
          </select>
          <textarea
            value={appealText}
            onChange={e => setAppealText(e.target.value)}
            rows={5}
            style={{width:'100%',padding:10,borderRadius:6,border:'1px solid #ccc',marginBottom:18}}
            disabled={appealLoading}
          />
          <div style={{display:'flex',justifyContent:'flex-end',gap:12}}>
            <button onClick={() => setShowAppealModal(false)} style={{padding:'8px 18px'}}>Cancel</button>
            <button onClick={handleAppealSubmit} style={{padding:'8px 18px',background:'#603bbb',color:'#fff',border:'none',borderRadius:4}} disabled={appealLoading || !appealText.trim() || !placement?.desired_pathway}>
              Submit Appeal
            </button>
          </div>
          {appealError && <div style={{color:'red',marginTop:12}}>{appealError}</div>}
        </Modal>
      </div>
    </div>
  );
};

export default StudentHome;
