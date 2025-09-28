import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginApp from "./pages/loginApp";
import RoleSelection from "./pages/roleSelection";
import AdminHome from "./pages/adminHome";
import TeacherHome from "./pages/teacherHome";
import StudentHome from "./pages/studentHome";
import Login from "./pages/login";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginApp />} />
        <Route path="/role" element={<RoleSelection />} />
        <Route path="/administrator" element={<AdminHome />} />
        <Route path="/teacher" element={<TeacherHome />} />
        <Route path="/student" element={<StudentHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
