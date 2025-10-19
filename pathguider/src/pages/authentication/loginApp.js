import React from "react";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import { useLocation } from "react-router-dom";

const LoginApp = ({ signupMode }) => {
  const location = useLocation();
  // If signupMode prop or /signup route, default to sign up form
  const showSignup = signupMode || location.pathname === "/signup";

  return showSignup ? <SignUp /> : <SignIn />;
};

export default LoginApp;
