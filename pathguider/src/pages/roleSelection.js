import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../App.css";

const RoleSelection = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    if (user) {
      const fetchName = async () => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setFirstName(userSnap.data().firstName || "");
        }
      };
      fetchName();
    }
  }, [user]);

  const handleRole = async (role) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { role }, { merge: true });
    navigate(`/${role}`);
  };

  if (!user) return null;

  return (
    <div className="role-selection-page">
      <div className="role-heading">
        {`Hello! Welcome to PathGuider, ${firstName}! Kindly let us know what user you are.`}
      </div>

      <div className="role-buttons">
        <button onClick={() => handleRole("administrator")}>Administrator</button>
        <button onClick={() => handleRole("teacher")}>Teacher</button>
        <button onClick={() => handleRole("student")}>Student</button>
      </div>
    </div>
  );
};

export default RoleSelection;
