
import React, { useEffect, useState } from "react";
import "../../App.css";
import { auth, db } from "../../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import Students from "../users/students";

// UploadGradesSection component for file upload UI
const UploadGradesSection = () => {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState("");

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
    // Here you would send the file to your Python backend using fetch or axios
    // Example:
    // const formData = new FormData();
    // formData.append('file', selectedFile);
    // await fetch('http://localhost:5000/upload', { method: 'POST', body: formData });
    setUploading(false);
    setSelectedFile(null);
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

  return (
    <div className="teacher-section" style={{marginBottom:32}}>
      <h3 style={{color:'#603bbb'}}>Upload Grades</h3>
      <div style={{background:'#fff',borderRadius:8,padding:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
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
    </div>
  );
};

const UploadedFilesSection = () => {
  const [files, setFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      const q = query(collection(db, "uploadedFiles"), orderBy("uploadedAt", "desc"));
      const snap = await getDocs(q);
      setFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
                  {file.uploadedAt && file.uploadedAt.toDate ? file.uploadedAt.toDate().toLocaleString() : (file.uploadedAt?.seconds ? new Date(file.uploadedAt.seconds * 1000).toLocaleString() : "-")}
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
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      if (!currentUser) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);


  const handleLogout = () => {
    auth.signOut()
      .then(() => navigate("/"))
      .catch((err) => console.error("Logout error:", err));
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("welcome");

  if (!authChecked) {
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
            </div>
          </>
        )}
        {activeSection === "students" && (
          <div className="teacher-section" style={{marginBottom:32}}>
            <h3 style={{color:'#603bbb'}}>All Students</h3>
            <div style={{background:'#fff',borderRadius:8,padding:24,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <Students />
            </div>
          </div>
        )}
        {activeSection === "upload" && (
          <UploadGradesSection />
        )}
        {activeSection === "files" && (
          <UploadedFilesSection />
        )}
      </main>
    </div>
  );
};

export default TeacherHome;
