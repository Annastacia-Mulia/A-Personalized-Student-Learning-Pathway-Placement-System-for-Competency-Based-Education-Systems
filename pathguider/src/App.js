import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginApp from "./pages/authentication/loginApp";
import SignUp from "./pages/authentication/SignUp";
import AuthCallback from "./pages/authentication/AuthCallback";
import LandingPage from "./pages/LandingPage";
import RoleSelection from "./pages/authentication/roleSelection";
import AdminHome from "./pages/homescreens/adminHome";
import Users from "./pages/users/users";
import Students from "./pages/users/students";
import Teachers from "./pages/users/teachers";
import TeacherHome from "./pages/homescreens/teacherHome";
import StudentHome from "./pages/homescreens/studentHome";
import Login from "./pages/authentication/login";
import TotpSetup from "./components/TotpSetup";
import TotpVerify from "./components/TotpVerify";
import PostSignInLanding from "./pages/authentication/PostSignInLanding";




function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginApp />} />
  <Route path="/signup" element={<SignUp />} />
  <Route path="/auth/callback" element={<AuthCallback />} />
  <Route path="/roleSelection" element={<RoleSelection />} />
  <Route path="/administrator" element={<AdminHome />} />
  <Route path="/administrator/users" element={<Users />} />
  <Route path="/administrator/students" element={<Students />} />
  <Route path="/administrator/teachers" element={<Teachers />} />
  <Route path="/teacher" element={<TeacherHome />} />
  <Route path="/student" element={<StudentHome />} />
  <Route path="/studentHome" element={<StudentHome />} />
  <Route path="/teacherHome" element={<TeacherHome />} />
  <Route path="/adminHome" element={<AdminHome />} />
  <Route path="/totp-setup" element={<TotpSetup />} />
  <Route path="/totp-verify" element={<TotpVerify />} />
  <Route path="/post-signin" element={<PostSignInLanding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;