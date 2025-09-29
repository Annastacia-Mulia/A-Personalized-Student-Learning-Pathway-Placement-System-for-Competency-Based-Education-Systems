import React, { useState } from "react";
import { auth, db, googleProvider } from "../../firebase";
import { createUserWithEmailAndPassword, signOut, sendEmailVerification, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Notification from "../../components/Notification";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signupMsg, setSignupMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const navigate = useNavigate();

  const clearInputs = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
  };

  const handleSignup = () => {
    clearErrors();
    setSignupMsg("");
    setLoading(true);
    if (!firstName || !lastName) {
      setLoading(false);
      setNotification({ message: "Please enter your first and last name.", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setLoading(false);
      setPasswordError("Passwords do not match");
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (cred) => {
        await sendEmailVerification(cred.user);
        setSignupMsg("Signup successful! A verification email has been sent. Please verify your email before logging in.");
        setNotification({ message: "Signup successful! A verification email has been sent.", type: "success" });
        await setDoc(doc(db, "users", cred.user.uid), {
          firstName,
          lastName,
        });
        signOut(auth); // keep logged out until email verified
        clearInputs();
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      })
      .catch((err) => {
        setLoading(false);
        setNotification({ message: err.message, type: "error" });
        switch (err.code) {
          case "auth/email-already-in-use":
          case "auth/invalid-email":
            setEmailError(err.message);
            break;
          case "auth/weak-password":
            setPasswordError(err.message);
            break;
          default:
            console.error(err);
        }
      });
  };

  const handleResendVerification = async () => {
    if (!email) {
      setNotification({ message: "Please enter your email above first.", type: "error" });
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      setNotification({ message: "Verification email resent! Check your inbox.", type: "success" });
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setNotification({ message: "", type: "" });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), {
        firstName: user.displayName ? user.displayName.split(" ")[0] : "",
        lastName: user.displayName ? user.displayName.split(" ").slice(1).join(" ") : "",
        email: user.email,
      });
      setNotification({ message: "Google sign up successful!", type: "success" });
      signOut(auth);
      clearInputs();
      setLoading(false);
    } catch (err) {
      setLoading(false);
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
        <h2 style={{color:'#603bbb',marginBottom:24}}>Sign Up</h2>
        <label>First Name</label>
        <input type="text" autoFocus required value={firstName} onChange={e => setFirstName(e.target.value)} />
        <label>Last Name</label>
        <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} />
        <label>Email</label>
        <input type="text" required value={email} onChange={e => setEmail(e.target.value)} />
        <p className="errorMsg">{emailError}</p>
        <label>Password</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        <label>Confirm Password</label>
        <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        <p className="errorMsg">{passwordError}</p>
        <button onClick={handleSignup} style={{marginTop:16}}>Sign Up</button>
        <button onClick={handleGoogleSignup} style={{ background: '#fff', color: '#333', border: '1px solid #ccc', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 22, height: 22 }} />
          Sign up with Google
        </button>
        <div style={{marginTop:12, textAlign:'center'}}>
          <span
            style={{ color: '#ffd700', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
            onClick={handleResendVerification}
          >
            Resend verification email
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
          Have an account?{' '}
          <span style={{color:'#ffd700',cursor:'pointer',textDecoration:'underline'}} onClick={()=>navigate('/login')}>Sign In</span>
        </p>
        {signupMsg && <div style={{color:'green',marginTop:12}}>{signupMsg}</div>}
      </div>
    </section>
  );
};

export default SignUp;
