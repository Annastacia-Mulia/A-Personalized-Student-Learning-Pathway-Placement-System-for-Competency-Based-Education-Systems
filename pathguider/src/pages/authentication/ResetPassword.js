import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useNavigate } from "react-router-dom";
import Notification from "../../components/Notification";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const handleReset = async () => {
    setLoading(true);
    setNotification({ message: "", type: "" });
    if (newPassword.length < 6) {
      setNotification({ message: "Password must be at least 6 characters.", type: "error" });
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotification({ message: "Passwords do not match.", type: "error" });
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setNotification({ message: error.message, type: "error" });
      } else {
        setNotification({ message: "✅ Password updated! You can now sign in.", type: "success" });
        setTimeout(() => navigate("/signin"), 2000);
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
        <h2 style={{ color: "#603bbb", marginBottom: 24 }}>Reset Password</h2>
        <label>New Password</label>
        <input
          type="password"
          required
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <label>Confirm New Password</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleReset} style={{ marginTop: 16 }} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </section>
  );
};

export default ResetPassword;
