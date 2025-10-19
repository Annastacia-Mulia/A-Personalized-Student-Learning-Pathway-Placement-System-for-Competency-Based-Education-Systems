import React, { useState, useEffect } from "react";
import { registerPasskey, authenticatePasskey } from "../../utils/passkey";
import { supabase } from "../../supabase";

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
  onGoogleSignup,
  onGoogleSignin,
  handleSignup,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [user, setUser] = useState(null);

  // Passkey-related state
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeySuccess, setPasskeySuccess] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // Check for user on mount (for Google OAuth redirect)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user has passkey registered
        // You might want to store this in your database
        const hasPasskey = localStorage.getItem(`passkey_registered_${session.user.id}`);
        if (!hasPasskey) {
          setUser(session.user);
          setEmail(session.user.email);
          setShowPasskeySetup(true);
        }
      }
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Check if user already has passkey
      const hasPasskey = localStorage.getItem(`passkey_registered_${data.user.id}`);
      
      if (!hasPasskey) {
        setUser(data.user);
        setShowPasskeySetup(true);
      } else {
        // Already has passkey, proceed to role selection
        window.location = "/roleSelection";
      }
    } catch (err) {
      setLoginError(err.message);
    }
  };

  // Passkey registration
  const handlePasskeyRegister = async () => {
    setPasskeyError("");
    setPasskeySuccess("");
    setPasskeyLoading(true);
    try {
      const result = await registerPasskey({ email: user?.email || email });
      if (result.success) {
        setPasskeySuccess("✅ Passkey registered successfully!");
        // Mark passkey as registered
        if (user) {
          localStorage.setItem(`passkey_registered_${user.id}`, 'true');
        }
        // Wait a moment to show success message
        setTimeout(() => {
          window.location = "/roleSelection";
        }, 1500);
      } else {
        setPasskeyError(result.error || "Passkey registration failed.");
      }
    } catch (err) {
      setPasskeyError(err.message);
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Skip passkey setup
  const handleSkipPasskey = () => {
    if (user) {
      localStorage.setItem(`passkey_registered_${user.id}`, 'skip');
    }
  window.location = "/roleSelection";
  };

  // Passkey authentication
  const handlePasskeyLogin = async () => {
    setPasskeyError("");
    setPasskeySuccess("");
    setPasskeyLoading(true);
    try {
      const result = await authenticatePasskey({ email });
      if (result.success) {
        setPasskeySuccess("✅ Passkey login successful!");
        setTimeout(() => {
          window.location = "/roleSelection";
        }, 1000);
      } else {
        setPasskeyError(result.error || "Passkey login failed.");
      }
    } catch (err) {
      setPasskeyError(err.message);
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Enhanced Google Sign In
  const handleGoogleSignInWithPasskey = async () => {
    try {
      await onGoogleSignin();
      // After Google sign in completes, the useEffect will handle passkey setup
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleGoogleSignUpWithPasskey = async () => {
    try {
      await onGoogleSignup();
      // After Google sign up completes, the useEffect will handle passkey setup
    } catch (err) {
      setLoginError(err.message);
    }
  };

  return (
    <section className="login">
      <div className="loginContainer">
        {/* Show passkey setup after login */}
        {showPasskeySetup ? (
          <div style={{ 
            background: '#fff', 
            padding: '32px', 
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px'
            }}>
              🔐
            </div>
            <h3 style={{ 
              color: '#603bbb',
              marginBottom: '16px',
              fontSize: '24px'
            }}>
              Set Up Passkey
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Add an extra layer of security to your account with biometric authentication (fingerprint, face ID, or security key)
            </p>

            {passkeyError && (
              <div style={{
                background: '#fee',
                border: '1px solid #fcc',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                color: '#c33'
              }}>
                {passkeyError}
              </div>
            )}

            {passkeySuccess && (
              <div style={{
                background: '#efe',
                border: '1px solid #cfc',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                color: '#3c3'
              }}>
                {passkeySuccess}
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={handlePasskeyRegister}
                disabled={passkeyLoading}
                style={{
                  background: '#603bbb',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: passkeyLoading ? 'not-allowed' : 'pointer',
                  opacity: passkeyLoading ? 0.7 : 1
                }}
              >
                {passkeyLoading ? "Setting up..." : "Set Up Passkey"}
              </button>

              <button
                onClick={handleSkipPasskey}
                disabled={passkeyLoading}
                style={{
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '14px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: passkeyLoading ? 'not-allowed' : 'pointer',
                  opacity: passkeyLoading ? 0.7 : 1
                }}
              >
                Skip for now
              </button>
            </div>

            <p style={{ 
              marginTop: '16px', 
              fontSize: '12px', 
              color: '#999' 
            }}>
              You can always set this up later in your account settings
            </p>
          </div>
        ) : (
          <>
            {/* Signup fields */}
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
                  <button
                    onClick={handlePasskeyLogin}
                    disabled={passkeyLoading}
                    style={{
                      background: "#e9f0ff",
                      color: "#333",
                      border: "1px solid #ccc",
                      marginTop: 10,
                    }}
                  >
                    {passkeyLoading ? "Authenticating..." : "Sign in with Passkey"}
                  </button>
                  <button
                    onClick={handleGoogleSignInWithPasskey}
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
                  <button
                    onClick={handleGoogleSignUpWithPasskey}
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
          </>
        )}
      </div>
    </section>
  );
};

export default Login;