import React from "react";
import { useNavigate } from "react-router-dom";

const PostSignInLanding = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)" }}>
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto", background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ color: "#6b21a8" }}><path d="M12 3L2 9l10 6 10-6-10-6zm0 13c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" fill="#6b21a8"/></svg>
        </div>
        <h2 style={{ textAlign: "center", marginBottom: 8, color: "#333", fontWeight: 700, fontSize: 22 }}>Two-Factor Authentication</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 18, fontSize: 15 }}>
          Have you already set up 2FA (Authenticator app) for your account?
        </p>
        <button
          onClick={() => navigate("/totp-verify")}
          style={{ width: "100%", padding: 14, background: "#22c55e", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, marginBottom: 12, border: "none", boxShadow: "0 2px 8px rgba(34,197,94,0.08)", cursor: "pointer", transition: "background 0.2s" }}
        >
          Yes, I have
        </button>
        <button
          onClick={() => navigate("/totp-setup")}
          style={{ width: "100%", padding: 14, background: "#603bbb", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, border: "none", boxShadow: "0 2px 8px rgba(96,59,187,0.08)", cursor: "pointer", transition: "background 0.2s" }}
        >
          No, I have not
        </button>
      </div>
    </div>
  );
};

export default PostSignInLanding;
