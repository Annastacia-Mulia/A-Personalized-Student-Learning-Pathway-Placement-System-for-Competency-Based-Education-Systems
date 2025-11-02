// components/TotpVerify.jsx
import React, { useState } from "react";
import { supabase } from "../supabase";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TotpVerify = ({ onSuccess }) => {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerify = async () => {
    setError("");
    if (code.length !== 6) {
      setError("Enter a 6-digit code.");
      return;
    }
    setVerifying(true);
    try {
      // find verified totp factor
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totp = factorsData?.all?.find((f) => f.factor_type === "totp" && f.status === "verified");
      if (!totp) throw new Error("No verified TOTP factor found.");

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      // set session tokens if returned
      if (verifyData?.access_token && verifyData?.refresh_token) {
        await supabase.auth.setSession({
          access_token: verifyData.access_token,
          refresh_token: verifyData.refresh_token,
        });
      }

      // fetch role and route
      const { data: profile, error: profileError } = await supabase
        .from("all_users")
        .select("role")
        .eq("id", verifyData?.user?.id || (await supabase.auth.getSession()).data?.session?.user?.id)
        .single();

      if (profileError) {
        // fallback: go to role selection
        navigate("/roleSelection");
      } else {
        if (!profile.role) navigate("/roleSelection");
        else if (profile.role === "student") navigate("/student");
        else if (profile.role === "teacher") navigate("/teacher");
        else navigate("/administrator");
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("TOTP verify error:", err);
      setError(err.message || "Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <ShieldCheck style={{ width: 36, height: 36, color: "#6b21a8" }} />
      </div>
      <h3 style={{ textAlign: "center", marginBottom: 8, color: "#333" }}>Two-Factor Verification</h3>
      <p style={{ textAlign: "center", color: "#666", marginBottom: 12 }}>Enter the 6-digit code from your authenticator app.</p>

      {error && <div style={{ background: "#fee", color: "#c33", padding: 8, borderRadius: 6, marginBottom: 12 }}>{error}</div>}

      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        maxLength={6}
        placeholder="123456"
        style={{ width: "100%", padding: 12, textAlign: "center", fontSize: 20, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }}
      />

      <button onClick={handleVerify} disabled={verifying || code.length !== 6} style={{ width: "100%", padding: 12, background: verifying || code.length !== 6 ? "#ddd" : "#603bbb", color: "#fff", borderRadius: 8 }}>
        {verifying ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
};

export default TotpVerify;
