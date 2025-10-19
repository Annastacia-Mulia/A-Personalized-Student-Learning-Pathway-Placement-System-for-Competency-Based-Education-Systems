
import React, { useEffect, useState } from "react";
import "../../App.css";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Students from "../users/students";
import PlacementsList from "../../components/PlacementsList";

// UploadGradesSection component for file upload UI and manual entry
const UploadGradesSection = ({ onStudentsRefresh }) => {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  // Manual entry state
  const [manualForm, setManualForm] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    stem: "",
    social_sciences: "",
    arts: ""
  });
  const [manualLoading, setManualLoading] = React.useState(false);
  const [manualMsg, setManualMsg] = React.useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setMessage(result.message || "File uploaded successfully!");
        if (onStudentsRefresh) onStudentsRefresh();
      } else {
        setMessage(result.message || "Upload failed.");
      }
    } catch (error) {
      setMessage("Error uploading file: " + error.message);
    }
    setUploading(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setUploading(false);
    setMessage("");
  };

  const fileInputRef = React.useRef();
  const handleClear = () => {
    setSelectedFile(null);
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Manual entry handlers
  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
    setManualMsg("");
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    setManualMsg("");
    // Send to backend for sorting and insertion
    try {
      const response = await fetch('http://localhost:5000/manual_upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: manualForm.first_name,
          last_name: manualForm.last_name,
          email: manualForm.email,
          stem: manualForm.stem,
          social_sciences: manualForm.social_sciences,
          arts: manualForm.arts
        })
      });
      const result = await response.json();
      if (response.ok) {
        setManualMsg(result.message || "Student uploaded and sorted successfully!");
        setManualForm({
          first_name: "",
          last_name: "",
          email: "",
          stem: "",
          social_sciences: "",
          arts: ""
        });
        if (onStudentsRefresh) onStudentsRefresh();
      } else {
        setManualMsg(result.message || "Failed to upload student.");
      }
    } catch (error) {
      setManualMsg("Error uploading student: " + error.message);
    }
    setManualLoading(false);
  };

  return (
    <div className="teacher-section" style={{marginBottom:32}}>
      <h3 style={{color:'#603bbb'}}>Upload Grades</h3>
      <div style={{background:'#fff',borderRadius:8,padding:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',marginBottom:32}}>
        <div style={{marginBottom:12,color:'#d32f2f',fontWeight:500}}>
          <span>Disclaimer: Please upload a file in <b>CSV</b> or <b>XLSX</b> format only.</span>
        </div>
        <form onSubmit={handleUpload} style={{display:'flex',flexDirection:'column',gap:16}}>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={uploading}
            ref={fileInputRef}
          />
          <div style={{display:'flex',gap:12}}>
            <button type="submit" disabled={uploading || !selectedFile} style={{width:120}}>
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            <button type="button" onClick={handleCancel} disabled={!uploading} style={{width:100}}>
              Cancel
            </button>
            <button type="button" onClick={handleClear} disabled={uploading && !selectedFile} style={{width:100}}>
              Clear
            </button>
          </div>
          {message && <div style={{color:'#603bbb',marginTop:8}}>{message}</div>}
        </form>
      </div>

      {/* Manual Upload Section */}
      <div style={{background:'#fff',borderRadius:8,padding:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        <h4 style={{color:'#603bbb',marginBottom:16}}>Manual Upload</h4>
        <form onSubmit={handleManualSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <input name="first_name" value={manualForm.first_name} onChange={handleManualChange} placeholder="First Name" required style={{padding:8,borderRadius:6,border:'1px solid #ccc'}} />
          <input name="last_name" value={manualForm.last_name} onChange={handleManualChange} placeholder="Last Name" required style={{padding:8,borderRadius:6,border:'1px solid #ccc'}} />
          <input name="email" value={manualForm.email} onChange={handleManualChange} placeholder="Email" required type="email" style={{padding:8,borderRadius:6,border:'1px solid #ccc'}} />
          <input name="stem" value={manualForm.stem} onChange={handleManualChange} placeholder="STEM Grade" required style={{padding:8,borderRadius:6,border:'1px solid #ccc'}} />
          <input name="social_sciences" value={manualForm.social_sciences} onChange={handleManualChange} placeholder="Social Sciences Grade" required style={{padding:8,borderRadius:6,border:'1px solid #ccc'}} />
          <input name="arts" value={manualForm.arts} onChange={handleManualChange} placeholder="Arts Grade" required style={{padding:8,borderRadius:6,border:'1px solid #ccc'}} />
          <button type="submit" disabled={manualLoading} style={{padding:'10px 0',background:'#603bbb',color:'#fff',border:'none',borderRadius:6,fontWeight:700}}>
            {manualLoading ? "Uploading..." : "Upload Student"}
          </button>
          {manualMsg && <div style={{color: manualMsg.includes('successfully') ? 'green' : 'red',marginTop:8}}>{manualMsg}</div>}
        </form>
      </div>
    </div>
  );
};

const UploadedFilesSection = () => {
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      // Fetch uploaded files metadata from Supabase
      const { data, error } = await supabase
        .from('uploaded_files') // Table name should match your Supabase schema
        .select('*')
        .order('uploadedAt', { ascending: false });
      if (error) {
        setFiles([]);
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };
    fetchFiles();
  }, []);

  return (
    <div className="teacher-section">
      <h3 style={{color:'#603bbb'}}>Uploaded Files</h3>
      <div style={{background:'#fff',borderRadius:8,padding:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
        {loading ? (
          <div>Loading...</div>
        ) : files.length === 0 ? (
          <div>No files uploaded yet.</div>
        ) : (
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {files.map(file => (
              <li key={file.id} style={{marginBottom:16,display:'flex',alignItems:'center',gap:16}}>
                <span style={{fontWeight:500}}>{file.name}</span>
                <span style={{color:'#888',fontSize:13}}>
                  {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : "-"}
                </span>
                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{color:'#603bbb',textDecoration:'underline'}}>Download</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const TeacherHome = () => {
  const studentsRef = React.useRef();
  const handleStudentsRefresh = () => {
    if (studentsRef.current && studentsRef.current.fetchStudents) {
      studentsRef.current.fetchStudents();
    }
  };
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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


  const handleLogout = () => {
    supabase.auth.signOut()
      .then(() => navigate("/"))
      .catch((err) => console.error("Logout error:", err));
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("welcome");

  if (!user) {
    return <div style={{textAlign:'center',marginTop:'2rem'}}>Loading...</div>;
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
          {sidebarOpen ? '⏴' : '⏵'}
        </button>
        <div className="sidebar-header">{sidebarOpen ? 'PathGuider Teacher' : 'PT'}</div>
        <nav className="sidebar-nav">
          <button className="sidebar-link" onClick={() => setActiveSection("welcome")}>{sidebarOpen ? 'Home' : '🏠'}</button>
          <button className="sidebar-link">{sidebarOpen ? 'Notifications' : '🔔'}</button>
          <button className="sidebar-link">{sidebarOpen ? 'Profile' : '👤'}</button>
          <button className="sidebar-link" onClick={() => setActiveSection("students")}>{sidebarOpen ? 'View All Students' : '👥'}</button>
          <button className="sidebar-link" onClick={() => setActiveSection("upload")}>{sidebarOpen ? 'Upload Grades' : '⬆️'}</button>
          <button className="sidebar-link" onClick={() => setActiveSection("files")}>{sidebarOpen ? 'Uploaded Files' : '📁'}</button>
          <button className="sidebar-link" onClick={() => setActiveSection("placements")}>{sidebarOpen ? 'View All Placements' : '🗂️'}</button>
          <button className="sidebar-link" onClick={handleLogout}>{sidebarOpen ? 'Log Out' : '🚪'}</button>
        </nav>
      </aside>
      <main className="admin-main-content">
        {activeSection === "welcome" && (
          <>
            <div className="admin-welcome">Welcome, Teacher! Here you can manage your classes and students.</div>
            <div className="admin-nav-btns">
              <button onClick={() => setActiveSection("students")}>View All Students</button>
              <button onClick={() => setActiveSection("upload")}>Upload Grades</button>
              <button onClick={() => setActiveSection("placements")}>View All Placements</button>
            </div>
          </>
        )}
        {activeSection === "students" && (
          <div className="teacher-section" style={{marginBottom:32}}>
            <h3 style={{color:'#603bbb'}}>All Students</h3>
            <div style={{background:'#fff',borderRadius:8,padding:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <Students ref={studentsRef} />
            </div>
          </div>
        )}
        {activeSection === "upload" && (
          <UploadGradesSection onStudentsRefresh={handleStudentsRefresh} />
        )}
        {activeSection === "files" && (
          <UploadedFilesSection />
        )}
        {activeSection === "placements" && (
          <PlacementsList isAdmin={false} />
        )}
      </main>
    </div>
  );
};

export default TeacherHome;
