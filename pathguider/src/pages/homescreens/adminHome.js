import React, { useEffect, useState } from "react";
import "../../App.css";
import { auth, db } from "../../firebase";
import { useNavigate, Routes, Route } from "react-router-dom";
import Users from "../users/users";
import Students from "../users/students";
import Teachers from "../users/teachers";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc as fsDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

// Table component with renderActions
function Table({ data, columns, keys, emptyMsg, renderActions }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: 20,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        <thead>
          <tr style={{ background: "#603bbb", color: "#fff" }}>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  padding: "12px 18px",
                  fontWeight: 600,
                  borderBottom: "2px solid #e9e9e9",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: 18 }}>
                {emptyMsg}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                style={{ background: i % 2 === 0 ? "#f7f7fa" : "#fff" }}
              >
                {keys.map((k) =>
                  k === "actions" ? (
                    <td
                      key={k}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #eee",
                        color: "#222",
                      }}
                    >
                      {renderActions ? renderActions(row) : null}
                    </td>
                  ) : (
                    <td
                      key={k}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #eee",
                        color: "#222",
                      }}
                    >
                      {row[k] || ""}
                    </td>
                  )
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const AdminHome = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Delete user
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await deleteDoc(fsDoc(db, "users", id));
    setAllUsers((users) => users.filter((u) => u.id !== id));
    setStudents((students) => students.filter((u) => u.id !== id));
    setTeachers((teachers) => teachers.filter((u) => u.id !== id));
  }

  // Update user (simple prompt for demo)
  async function handleUpdate(id, user) {
    const newFirst = window.prompt("Edit first name", user.firstName || "");
    const newLast = window.prompt("Edit last name", user.lastName || "");
    if (newFirst && newLast) {
      await updateDoc(fsDoc(db, "users", id), {
        firstName: newFirst,
        lastName: newLast,
      });
      setAllUsers((users) =>
        users.map((u) =>
          u.id === id ? { ...u, firstName: newFirst, lastName: newLast } : u
        )
      );
      setStudents((students) =>
        students.map((u) =>
          u.id === id ? { ...u, firstName: newFirst, lastName: newLast } : u
        )
      );
      setTeachers((teachers) =>
        teachers.map((u) =>
          u.id === id ? { ...u, firstName: newFirst, lastName: newLast } : u
        )
      );
    }
  }

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

  // Fetch all users, students, and teachers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        setAllUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const studentsQ = query(collection(db, "users"), where("role", "==", "student"));
        const studentsSnap = await getDocs(studentsQ);
        setStudents(studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        const teachersQ = query(collection(db, "users"), where("role", "==", "teacher"));
        const teachersSnap = await getDocs(teachersQ);
        setTeachers(teachersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    if (authChecked) fetchUsers();
  }, [authChecked]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => navigate("/"))
      .catch((err) => console.error("Logout error:", err));
  };


  const [sidebarOpen, setSidebarOpen] = useState(true);
  if (!authChecked) {
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>;
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <button className="sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
          {sidebarOpen ? '⏴' : '⏵'}
        </button>
        <div className="sidebar-header">{sidebarOpen ? 'PathGuider Administrator' : 'PG'}</div>
        <nav className="sidebar-nav">
          <button className="sidebar-link" onClick={() => navigate("notifications")}>{sidebarOpen ? 'Notifications' : '🔔'}</button>
          <button className="sidebar-link" onClick={() => navigate("appeals")}>{sidebarOpen ? 'Appeals' : '📄'}</button>
          <button className="sidebar-link" onClick={() => navigate("profile")}>{sidebarOpen ? 'Profile' : '👤'}</button>
          <button className="sidebar-link" onClick={handleLogout}>{sidebarOpen ? 'Log Out' : '🚪'}</button>
          <button className="sidebar-link" onClick={() => navigate("settings")}>{sidebarOpen ? 'Settings' : '⚙️'}</button>
        </nav>
      </aside>
      <main className="admin-main-content">
        <div className="admin-welcome">Welcome, Administrator! Here you can manage the system.</div>
        <div className="admin-nav-btns">
          <button onClick={() => navigate("users")}>View All Users</button>
          <button onClick={() => navigate("students")}>View All Students</button>
          <button onClick={() => navigate("teachers")}>View All Teachers</button>
        </div>
        <div style={{ marginTop: 50 }}>
          <Routes>
            <Route path="users" element={<Users />} />
            <Route path="students" element={<Students />} />
            <Route path="teachers" element={<Teachers />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminHome;
