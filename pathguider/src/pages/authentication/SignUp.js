import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Notification from "../../components/Notification";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      setNotification({ message: "All fields are required.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signin`,
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create a record in all_users table for consistency
        const { error: insertError } = await supabase.from("all_users").upsert({
          id: data.user.id,
          email: data.user.email,
          first_name: firstName,
          last_name: lastName,
          role: null,
          totp_enabled: false,
        });

        if (insertError) console.error("Error creating user in all_users:", insertError);

        // Force sign out to require email verification before proceeding
        await supabase.auth.signOut();

        setNotification({
          message: "✅ Sign up successful! Please verify your email before signing in.",
          type: "success",
        });

        // After short delay, redirect to sign-in page
        setTimeout(() => navigate("/signin"), 2500);
      }
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

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
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <label>Last Name</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleSignUp} disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p
          style={{
            marginTop: 24,
            color: "#fff",
            textAlign: "center",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Already have an account?{" "}
          <span
            style={{
              color: "#ffd700",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => navigate("/signin")}
          >
            Sign In
          </span>
        </p>
      </div>
    </section>
  );
};

export default SignUp;
