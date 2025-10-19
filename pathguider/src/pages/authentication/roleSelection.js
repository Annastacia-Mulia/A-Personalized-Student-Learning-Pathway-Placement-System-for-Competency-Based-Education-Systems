import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import "../../App.css";

const RoleSelection = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data, error } = await supabase
          .from('users')
          .select('firstName')
          .eq('id', currentUser.id)
          .single();
        if (data && data.firstName) {
          setFirstName(data.firstName);
        }
      }
    };
    fetchUser();
  }, []);

 const handleRole = async (role) => {
  if (!user) return;
  await supabase
    .from('users')
    .update({ role })
    .eq('id', user.id);

  if (role === "administrator") {
    navigate("/administrator");
  } else if (role === "teacher") {
    navigate("/teacher");
  } else if (role === "student") {
    navigate("/student");
  }
};

  if (!user) return null;
  // ...existing code...

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
