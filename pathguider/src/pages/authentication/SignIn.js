import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Notification from "../../components/Notification";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        email,
        password,
      });

      if (error) {
        setLoading(false);
        if (error.message.includes("Invalid login credentials")) {
          setPasswordError("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          setNotification({
            message: "Please verify your email before logging in.",
            type: "error",
          });
        } else {
          setNotification({ message: error.message, type: "error" });
        }
        return;
      }

      if (data.user) {
        // Check if user has a role
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        setLoading(false);

        // If user doesn't exist or has no role, go to role selection
        if (profileError || !profile || !profile.role) {
          // Ensure user record exists
          if (profileError && profileError.code === "PGRST116") {
            await supabase.from("users").insert({
              id: data.user.id,
              email: data.user.email,
            });
          }
          navigate("/roleSelection");
        } else {
          // Redirect to their specific dashboard
          navigate(`/${profile.role}`);
        }
      }
    } catch (err) {
      setLoading(false);
      setNotification({ message: err.message, type: "error" });
    }
  };

  const handleGoogleSignin = async () => {
    setLoading(true);
    setNotification({ message: "", type: "" });
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setNotification({ message: error.message, type: "error" });
        setLoading(false);
      }
      // Redirect handled by /auth/callback
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
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
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>
    );

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
          type="text"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="errorMsg">{emailError}</p>

        <label>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="errorMsg">{passwordError}</p>

        <button onClick={handleLogin} style={{ marginTop: 16 }}>
          Sign In
        </button>

        <button
          onClick={handleGoogleSignin}
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
          Sign in with Google
        </button>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <span
            style={{
              color: "#ffd700",
              cursor: "pointer",
              textDecoration: "underline",
              fontWeight: 500,
            }}
            onClick={handleForgotPassword}
          >
            Forgot password?
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
          Don’t have an account?{" "}
          <span
            style={{
              color: "#ffd700",
              cursor: "pointer",
              textDecoration: "underline",
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
