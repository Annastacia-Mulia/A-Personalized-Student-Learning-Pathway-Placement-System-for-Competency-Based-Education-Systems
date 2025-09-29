import React, { useEffect, useState } from "react";
import "../../App.css";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const StudentHome = () => {
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

  if (!authChecked) {
    return <div style={{textAlign:'center',marginTop:'2rem'}}>Loading...</div>;
  }

  return (
    <div className="home-page">
      <nav className="home-nav">
        <h2>Student Dashboard</h2>
        <button onClick={handleLogout}>Log Out</button>
      </nav>

      <div className="home-content">
        <p>Welcome, Student! Here you can view your learning path and progress.</p>
      </div>
    </div>
  );
};

export default StudentHome;
