import React, { useState, useEffect } from "react";
import { auth, db, googleProvider } from "../../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
} from "firebase/auth";



import { doc, getDoc, setDoc } from "firebase/firestore";
import Login from "./login";
import Notification from "../../components/Notification";
import { useNavigate, useLocation } from "react-router-dom";

const LoginApp = ({ signupMode }) => {
  // Google Sign Up
  const handleGoogleSignup = async () => {
    setLoading(true);
    setNotification({ message: "", type: "" });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        // Create user doc with Google info
        await setDoc(userRef, {
          firstName: user.displayName ? user.displayName.split(" ")[0] : "",
          lastName: user.displayName ? user.displayName.split(" ").slice(1).join(" ") : "",
          email: user.email,
        });
        setNotification({ message: "Google sign up successful!", type: "success" });
      }
      // Redirect to role selection if no role, else to dashboard
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().role) {
        navigate(`/${snap.data().role}`);
      } else {
        navigate("/role");
      }
    } catch (err) {
      setNotification({ message: err.message, type: "error" });
    }
    setLoading(false);
  };

  // Google Sign In
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
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false); // NEW: track loading
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const location = useLocation();
  // If signupMode prop or /signup route, default to sign up form
  const [hasAccount, setHasAccount] = useState(() => {
    if (signupMode) return false;
    if (location.pathname === "/signup") return false;
    return true;
  });

  // Always force sign up form if on /signup route
  useEffect(() => {
    if (location.pathname === "/signup") {
      setHasAccount(false);
    }
  }, [location.pathname]);
  const [resetMsg, setResetMsg] = useState("");
  const [signupMsg, setSignupMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const handleForgotPassword = () => {
    setResetMsg("");
    if (!email) {
      setResetMsg("Please enter your email above to reset password.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setResetMsg("Password reset email sent! Check your inbox.");
      })
      .catch((err) => {
        setResetMsg(err.message);
      });
  };

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

  const handleLogin = () => {
    clearErrors();
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (cred) => {
        if (!cred.user.emailVerified) {
          setLoading(false);
          alert("Please verify your email before logging in.");
          signOut(auth);
          return;
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
            console.error(err);
        }
      });
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
        // Do not navigate immediately, let user see the message
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

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setHasAccount(true); // Always show sign in form after logout
    navigate("/");
  };

  // 🔹 Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true); // finished checking
      if (!currentUser) {
        setHasAccount(true); // Always show sign in form if redirected to login
      }
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Loading state
  if (!authChecked || loading) {
    return <div style={{textAlign:'center',marginTop:'2rem'}}>Loading...</div>;
  }

  return (
    <div>
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />
      {!user ? (
        <>
          <Login
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handleLogin={handleLogin}
            handleSignup={handleSignup}
            hasAccount={hasAccount}
            setHasAccount={setHasAccount}
            emailError={emailError}
            passwordError={passwordError}
            onForgotPassword={handleForgotPassword}
            resetMsg={resetMsg}
            signupMsg={signupMsg}
            onGoogleSignup={handleGoogleSignup}
            onGoogleSignin={handleGoogleSignin}
          />
        </>
      ) : (
        <div>
          <h2>Welcome, {user.email}!</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default LoginApp;
