import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Notification from "../../components/Notification";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (error) {
        setLoading(false);
        if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid")) {
          setPasswordError("Invalid email or password");
          setNotification({ 
            message: "Invalid email or password. Please try again.", 
            type: "error" 
          });
        } else if (error.message.includes("Email not confirmed")) {
          setNotification({
            message: "Please verify your email before signing in. Check your inbox.",
            type: "error",
          });
        } else {
          setNotification({ message: error.message, type: "error" });
        }
        return;
      }

      if (data.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setNotification({
            message: "⚠️ Please verify your email before signing in. Check your inbox for the verification link.",
            type: "error",
          });
          setLoading(false);
          return;
        }

        // Redirect to post-signin landing page before any TOTP/role logic
        navigate("/post-signin");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setLoading(false);
      setNotification({ message: err.message, type: "error" });
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: "center", 
        marginTop: "2rem", 
        color: "#603bbb",
        fontSize: 18 
      }}>
        Signing in...
      </div>
    );
  }

  return (
    <section className="login">
      <div className="loginContainer">
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ message: "", type: "" })} 
        />

        <h2 style={{ color: "#603bbb", marginBottom: 24 }}>Sign In</h2>

        <label>Email</label>
        <input 
          type="email" 
          required 
          value={email} 
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          onKeyPress={handleKeyPress}
        />
        <p className="errorMsg">{emailError}</p>

        <label>Password</label>
        <div style={{ position: "relative" }}>
          <input 
            type={showPassword ? "text" : "password"} 
            required 
            value={password} 
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            onKeyPress={handleKeyPress}
          />
          <span 
            style={{ 
              position: "absolute", 
              right: "10px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              cursor: "pointer", 
              color: "#603bbb", 
              fontWeight: 500 
            }} 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>
        <p className="errorMsg">{passwordError}</p>

        <button onClick={handleLogin} style={{ marginTop: 16 }}>
          Sign In
        </button>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <span
            style={{
              color: "#ffd700",
              cursor: "pointer",
              textDecoration: "underline",
              fontWeight: 500,
            }}
            onClick={async () => {
              if (!email) {
                setNotification({
                  message: "Please enter your email above first.",
                  type: "error",
                });
                return;
              }
              try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) {
                  setNotification({ message: error.message, type: "error" });
                } else {
                  setNotification({
                    message: "Password reset email sent! Check your inbox.",
                    type: "success",
                  });
                }
              } catch (err) {
                setNotification({ message: err.message, type: "error" });
              }
            }}
          >
            Forgot password?
          </span>
        </div>

        <div style={{ margin: "16px 0", textAlign: "center", color: "#999" }}>
          OR
        </div>

        <button
          onClick={handleGoogleSignIn}
          style={{
            background: "#fff",
            color: "#333",
            border: "1px solid #ccc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "12px"
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: 22, height: 22 }}
          />
          Sign in with Google
        </button>

        <p style={{ 
          marginTop: 24, 
          color: "#fff", 
          textAlign: "center", 
          fontWeight: 600, 
          fontSize: 16, 
          letterSpacing: 0.5 
        }}>
          Don't have an account?{" "}
          <span 
            style={{ 
              color: "#ffd700", 
              cursor: "pointer", 
              textDecoration: "underline" 
            }} 
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </section>
  );
};

export default SignIn;