// components/TotpSetup.jsx
import React, { useState } from "react";
import { supabase } from "../supabase";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Shield, Check, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TotpSetup = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [uri, setUri] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) throw new Error("Sign in required to set up 2FA.");

      // Enroll
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (enrollError) throw enrollError;
      const totp = data?.totp;
      if (!totp?.uri) throw new Error("Failed to obtain TOTP URI.");

      setUri(totp.uri);
      setFactorId(data.id);
      setStep(1);
    } catch (err) {
      console.error("Totp enroll error:", err);
      setError(err.message || "Failed to start TOTP enrollment.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    if (code.length !== 6) {
      setError("Enter a 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      // challenge -> verify
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      // Mark totp_enabled true in all_users
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        await supabase
          .from("all_users")
          .update({ totp_enabled: true })
          .eq("id", user.id);
      }

      setStep(2);
      if (onComplete) onComplete();

      // Redirect to role selection
      setTimeout(() => navigate("/roleSelection"), 900);
    } catch (err) {
      console.error("Totp verify error:", err);
      setError(err.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6b21a8 0%, #4c1d95 100%)" }}>
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto", background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <Shield style={{ width: 36, height: 36, color: "#6b21a8" }} />
        </div>
        <h2 style={{ textAlign: "center", marginBottom: 8, color: "#333", fontWeight: 700, fontSize: 22 }}>Set Up Two-Factor Authentication</h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 18, fontSize: 15 }}>
          Protect your account with an extra layer of security.
        </p>

        {error && (
          <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8, padding: 12, background: "#fee", borderRadius: 8, color: "#c33", width: "100%" }}>
            <AlertCircle style={{ width: 20, height: 20, color: "#c33" }} />
            <span style={{ fontSize: 15 }}>{error}</span>
          </div>
        )}

        {step === 0 && (
          <>
            <div style={{ background: "#f6f6fa", borderRadius: 10, padding: 18, marginBottom: 18, width: "100%" }}>
              <ol style={{ fontSize: 15, color: "#444", margin: 0, paddingLeft: 18 }}>
                <li> Install Google Authenticator, Microsoft Authenticator, or Authy on your mobile device.</li>
                <li> Click Begin Setup to get the QR code.</li>
                <li> Scan the QR and enter the 6-digit code to confirm.</li>
              </ol>
            </div>
            <button
              onClick={startSetup}
              disabled={loading}
              style={{ width: "100%", padding: 14, background: loading ? "#ddd" : "#603bbb", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, border: "none", boxShadow: "0 2px 8px rgba(96,59,187,0.08)", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {loading ? <Loader2 style={{ animation: "spin 1s linear infinite", color: "#603bbb", width: 24, height: 24 }} /> : "Begin Setup"}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ background: "#f6f6fa", borderRadius: 10, padding: 18, textAlign: "center", marginBottom: 18, width: "100%" }}>
              <h3 style={{ fontWeight: 600, color: "#333", marginBottom: 12 }}>Scan this QR Code</h3>
              {uri ? (
                <div style={{ display: "inline-block", background: "#fff", border: "1px solid #eee", padding: 8, borderRadius: 8 }}>
                  <QRCodeSVG value={uri} size={180} />
                </div>
              ) : (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 style={{ animation: "spin 1s linear infinite", color: "#603bbb", width: 32, height: 32 }} />
                </div>
              )}
              {uri && (
                <div style={{ fontSize: 13, color: "#1e40af", marginTop: 12, background: "#eff6ff", borderRadius: 8, padding: 10, border: "1px solid #bae6fd" }}>
                  Can't scan? Paste this URI into your authenticator app:
                  <div style={{ wordBreak: "break-all", fontFamily: "monospace", fontSize: 13, marginTop: 6 }}>{uri}</div>
                </div>
              )}
            </div>
            <label style={{ display: "block", fontSize: 15, fontWeight: 500, color: "#333", marginBottom: 8 }}>Enter 6-digit code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              style={{ width: "100%", padding: 12, textAlign: "center", fontSize: 20, borderRadius: 8, border: "1px solid #ddd", marginBottom: 14, fontFamily: "monospace", letterSpacing: 4 }}
            />
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              style={{ width: "100%", padding: 14, background: loading || code.length !== 6 ? "#ddd" : "#603bbb", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, border: "none", boxShadow: "0 2px 8px rgba(96,59,187,0.08)", cursor: loading || code.length !== 6 ? "not-allowed" : "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {loading ? <Loader2 style={{ animation: "spin 1s linear infinite", color: "#603bbb", width: 24, height: 24 }} /> : "Verify"}
            </button>
          </>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{ background: "#bbf7d0", borderRadius: "50%", padding: 16, display: "inline-block", marginBottom: 18 }}>
              <Check style={{ width: 48, height: 48, color: "#22c55e" }} />
            </div>
            <h3 style={{ fontWeight: 700, color: "#333", fontSize: 20, marginBottom: 8 }}>Two-Factor Authentication Enabled!</h3>
            <p style={{ color: "#666", fontSize: 15, marginBottom: 18 }}>You're all set — you'll need your authenticator to sign in from now on.</p>
            <button onClick={() => navigate("/roleSelection")}
              style={{ width: "100%", padding: 14, background: "#603bbb", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, border: "none", boxShadow: "0 2px 8px rgba(96,59,187,0.08)", cursor: "pointer", transition: "background 0.2s" }}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TotpSetup;
