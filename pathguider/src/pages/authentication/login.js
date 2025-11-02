import React, { useState, useEffect } from "react";
import { registerPasskey } from "../../utils/passkey";
import { supabase } from "../../supabase";
import TotpVerify from "../../components/TotpVerify";

const Login = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  hasAccount,
  setHasAccount,
  emailError,
  passwordError,
  onForgotPassword,
  resetMsg,
  handleSignup,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [user, setUser] = useState(null);
  const [showTotp, setShowTotp] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeySuccess, setPasskeySuccess] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // ✅ Handle redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const hasPasskey = localStorage.getItem(`passkey_registered_${session.user.id}`);
        if (!hasPasskey) {
          setUser(session.user);
          setEmail(session.user.email);
          setShowPasskeySetup(true);
        }
      }
    };
    checkUser();
  }, [setEmail]);

  // ✅ Standard email/password login
  const handleLogin = async () => {
    setLoginError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const user = data.user;

      // Check for verified TOTP factor
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const hasTotp = factorsData?.all?.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );

      // Fetch user role
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = profile?.role || "";

      if (hasTotp) {
        setUser(user);
        setUserRole(role);
        setShowTotp(true);
      } else {
        const hasPasskey = localStorage.getItem(`passkey_registered_${user.id}`);
        if (!hasPasskey) {
          setUser(user);
          setShowPasskeySetup(true);
        } else {
          navigateToRole(role);
        }
      }
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const navigateToRole = (role) => {
    if (role === "student") window.location = "/studentHome";
    else if (role === "teacher") window.location = "/teacherHome";
    else if (role === "admin") window.location = "/adminHome";
    else window.location = "/roleSelection";
  };

  // ✅ Passkey setup after login
  const handlePasskeyRegister = async () => {
    setPasskeyError("");
    setPasskeySuccess("");
    setPasskeyLoading(true);
    try {
      const result = await registerPasskey({ email: user?.email || email });
      if (result.success) {
        localStorage.setItem(`passkey_registered_${user.id}`, "true");
        setPasskeySuccess("✅ Passkey registered successfully!");
        navigateToRole(userRole || "roleSelection");
      } else {
        setPasskeyError(result.error || "Failed to register passkey.");
      }
    } catch (err) {
      setPasskeyError(err.message);
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleSkipPasskey = () => {
    navigateToRole(userRole || "roleSelection");
  };

  // ✅ After successful TOTP verification
  const handleTotpSuccess = () => {
    setShowTotp(false);
    if (showPasskeySetup) setShowPasskeySetup(true);
    else navigateToRole(userRole);
  };

  // ✅ If user must verify TOTP, show TotpVerify component
  if (showTotp) {
    return (
      <TotpVerify
        supabase={supabase}
        onSuccess={handleTotpSuccess}
        onCancel={() => setShowTotp(false)}
      />
    );
  }

  // ✅ If user must set up passkey
  if (showPasskeySetup) {
    return (
      <section className="login">
        <div className="loginContainer">
          <div
            style={{
              background: "#fff",
              padding: "32px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔐</div>
            <h3
              style={{
                color: "#603bbb",
                marginBottom: "16px",
                fontSize: "24px",
              }}
            >
              Set Up Passkey
            </h3>
            <p
              style={{
                color: "#666",
                marginBottom: "24px",
                lineHeight: "1.6",
              }}
            >
              Add biometric authentication (fingerprint, face ID, or security
              key) for quick and secure sign-in.
            </p>

            {passkeyError && (
              <div
                style={{
                  background: "#fee",
                  border: "1px solid #fcc",
                  padding: "12px",
                  borderRadius: "4px",
                  marginBottom: "16px",
                  color: "#c33",
                }}
              >
                {passkeyError}
              </div>
            )}

            {passkeySuccess && (
              <div
                style={{
                  background: "#efe",
                  border: "1px solid #cfc",
                  padding: "12px",
                  borderRadius: "4px",
                  marginBottom: "16px",
                  color: "#3c3",
                }}
              >
                {passkeySuccess}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={handlePasskeyRegister}
                disabled={passkeyLoading}
                style={{
                  background: "#603bbb",
                  color: "#fff",
                  border: "none",
                  padding: "14px 24px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: passkeyLoading ? "not-allowed" : "pointer",
                  opacity: passkeyLoading ? 0.7 : 1,
                }}
              >
                {passkeyLoading ? "Setting up..." : "Set Up Passkey"}
              </button>

              <button
                onClick={handleSkipPasskey}
                disabled={passkeyLoading}
                style={{
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #ddd",
                  padding: "14px 24px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: passkeyLoading ? "not-allowed" : "pointer",
                  opacity: passkeyLoading ? 0.7 : 1,
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ✅ Default login/signup UI
  return (
    <section className="login">
      <div className="loginContainer">
        {!hasAccount && (
          <>
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
          </>
        )}

        <label>Email</label>
        <input
          type="text"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="errorMsg">{emailError}</p>

        {hasAccount && resetMsg && (
          <p
            className="errorMsg"
            style={{
              color: resetMsg.includes("sent") ? "green" : "red",
            }}
          >
            {resetMsg}
          </p>
        )}

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

        {!hasAccount && (
          <>
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
          </>
        )}

        <p className="errorMsg">{passwordError}</p>
        {loginError && <p className="errorMsg">{loginError}</p>}

        <div className="btnContainer">
          {hasAccount ? (
            <>
              <button onClick={handleLogin}>Sign In</button>
              <p>
                <span
                  style={{
                    cursor: "pointer",
                    color: "#007bff",
                    marginRight: 10,
                  }}
                  onClick={onForgotPassword}
                >
                  Forgot Password?
                </span>
                Don't have an account?{" "}
                <span
                  style={{ cursor: "pointer", color: "#007bff" }}
                  onClick={() => setHasAccount(!hasAccount)}
                >
                  Sign Up
                </span>
              </p>
            </>
          ) : (
            <>
              <button onClick={handleSignup}>Sign Up</button>
              <p>
                Have an account?{" "}
                <span
                  style={{ cursor: "pointer", color: "#007bff" }}
                  onClick={() => setHasAccount(!hasAccount)}
                >
                  Sign In
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Login;
