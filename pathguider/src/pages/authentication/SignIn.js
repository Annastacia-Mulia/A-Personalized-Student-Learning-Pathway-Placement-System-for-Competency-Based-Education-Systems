import React, { useState } from "react";
import { auth, db, googleProvider } from "../../firebase";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Notification from "../../components/Notification";
import { getIdToken } from "../../utils/getIdToken";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const handleLogin = () => {
    setEmailError("");
    setPasswordError("");
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (cred) => {
        if (!cred.user.emailVerified) {
          setLoading(false);
          alert("Please verify your email before logging in.");
          return;
        }
        // Get ID token and set session cookie
        try {
          const idToken = await getIdToken();
          console.log("About to call /sessionLogin", idToken);
          await fetch("http://localhost:4000/sessionLogin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken }),
          });
        } catch (e) {
          setNotification({ message: "Session cookie error: " + e.message, type: "error" });
        }
        const userRef = doc(db, "users", cred.user.uid);
        const userSnap = await getDoc(userRef);
        setLoading(false);
        if (userSnap.exists() && userSnap.data().role) {
          navigate(`/${userSnap.data().role}`);
        } else {
          navigate("/role");
        }
      })
      .catch((err) => {
        setLoading(false);
        switch (err.code) {
          case "auth/invalid-email":
          case "auth/user-disabled":
          case "auth/user-not-found":
            setEmailError(err.message);
            break;
          case "auth/wrong-password":
            setPasswordError(err.message);
            break;
          default:
            setNotification({ message: err.message, type: "error" });
        }
      });
  };
  // Optional: Add a logout handler to clear session cookie
  const handleSessionLogout = async () => {
    await fetch("http://localhost:4000/sessionLogout", {
      method: "POST",
      credentials: "include"
    });
    await signOut(auth);
    navigate("/login");
  };

  const handleGoogleSignin = async () => {
    setLoading(true);
    setNotification({ message: "", type: "" });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().role) {
        navigate(`/${userSnap.data().role}`);
      } else {
        navigate("/role");
      }
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
    setLoading(false);
  };


  const handleForgotPassword = async () => {
    if (!email) {
      setNotification({ message: "Please enter your email above first.", type: "error" });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setNotification({ message: "Password reset email sent! Check your inbox.", type: "success" });
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
  };

  if (loading) return <div style={{textAlign:'center',marginTop:'2rem'}}>Loading...</div>;

  return (
    <section className="login">
      <div className="loginContainer">
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
        <h2 style={{color:'#603bbb',marginBottom:24}}>Sign In</h2>
        <label>Email</label>
        <input type="text" required value={email} onChange={e => setEmail(e.target.value)} />
        <p className="errorMsg">{emailError}</p>
        <label>Password</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        <p className="errorMsg">{passwordError}</p>
        <button onClick={handleLogin} style={{marginTop:16}}>Sign In</button>
        <button onClick={handleGoogleSignin} style={{ background: '#fff', color: '#333', border: '1px solid #ccc', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 22, height: 22 }} />
          Sign in with Google
        </button>
        <div style={{marginTop:12, textAlign:'center'}}>
          <span
            style={{ color: '#ffd700', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
            onClick={handleForgotPassword}
          >
            Forgot password?
          </span>
        </div>
        <p style={{
          marginTop: 24,
          color: '#fff',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: 0.5
        }}>
          Don’t have an account?{' '}
          <span style={{color:'#ffd700',cursor:'pointer',textDecoration:'underline'}} onClick={()=>navigate('/signup')}>Sign Up</span>
        </p>
      </div>
    </section>
  );
};

export default SignIn;
