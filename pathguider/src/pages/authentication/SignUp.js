import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Notification from "../../components/Notification";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signupMsg, setSignupMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [createdUser, setCreatedUser] = useState(null);
  const navigate = useNavigate();

  const clearInputs = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
  };

  // --- Handle Email Signup ---
  const handleSignup = async () => {
    clearErrors();
    setSignupMsg("");
    setLoading(true);

    if (!firstName || !lastName) {
      setLoading(false);
      setNotification({
        message: "Please enter your first and last name.",
        type: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        setNotification({ message: error.message, type: "error" });
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }

        setSignupMsg(
          "Signup successful! A verification email has been sent. Please verify your email before logging in."
        );
        setNotification({
          message:
            "Signup successful! A verification email has been sent to your inbox.",
          type: "success",
        });

  clearInputs();
  setTimeout(() => navigate("/login"), 1000);
      }
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Google Signup ---
  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setNotification({ message: error.message, type: "error" });
        setLoading(false);
      }
      // Note: OAuth redirect will handle the rest
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
      setLoading(false);
    }
  };

  // --- Handle resend verification email ---
  const handleResendVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotification({
        message: "You need to be logged in to resend verification email.",
        type: "error",
      });
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });
      
      if (error) {
        setNotification({ message: error.message, type: "error" });
      } else {
        setNotification({
          message: "Verification email re-sent successfully.",
          type: "success",
        });
      }
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem", color: "#fff" }}>
        Loading...
      </div>
    );
  }

  // ...existing code...

  // --- Default signup form ---
  return (
    <section className="login">
      <div className="loginContainer">
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />

        <h2 style={{ color: "#603bbb", marginBottom: 24 }}>Sign Up</h2>

        <label>First Name</label>
        <input
          type="text"
          autoFocus
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <label>Last Name</label>
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <label>Email</label>
        <input
          type="text"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="errorMsg">{emailError}</p>

        <label>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#603bbb",
              fontWeight: 500,
            }}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <label>Confirm Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showConfirm ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#603bbb",
              fontWeight: 500,
            }}
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? "Hide" : "Show"}
          </span>
        </div>
        <p className="errorMsg">{passwordError}</p>

        <button onClick={handleSignup} style={{ marginTop: 16 }}>
          Sign Up
        </button>

        <button
          onClick={handleGoogleSignup}
          style={{
            background: "#fff",
            color: "#333",
            border: "1px solid #ccc",
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: 22, height: 22 }}
          />
          Sign up with Google
        </button>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <span
            style={{
              color: "#ffd700",
              cursor: "pointer",
              textDecoration: "underline",
              fontWeight: 500,
            }}
            onClick={handleResendVerification}
          >
            Resend verification email
          </span>
        </div>

        <p
          style={{
            marginTop: 24,
            color: "#fff",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          Have an account?{" "}
          <span
            style={{
              color: "#ffd700",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => navigate("/login")}
          >
            Sign In
          </span>
        </p>

        {signupMsg && (
          <div style={{ color: "green", marginTop: 12 }}>{signupMsg}</div>
        )}
      </div>
    </section>
  );
};

export default SignUp;
