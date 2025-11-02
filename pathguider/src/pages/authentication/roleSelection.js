import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import "../../App.css";

const RoleSelection = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get authenticated user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Get user data from all_users table
        const { data, error } = await supabase
          .from("all_users")
          .select("first_name, role")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          console.error("Error fetching user:", error.message);
          setLoading(false);
          return;
        }

        if (data) {
          setFirstName(data.first_name || "");

          // If user already has a role, redirect immediately
          if (data.role) {
            setHasRole(true);
            redirectToRole(data.role);
            return;
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const redirectToRole = (role) => {
    if (role === "administrator") navigate("/administrator");
    else if (role === "teacher") navigate("/teacher");
    else if (role === "student") navigate("/student");
  };

  const handleRole = async (role) => {
    if (!user) return;

    setUpdating(true);
    
    try {
      // Update role in all_users table
      const { error: allUserError } = await supabase
        .from("all_users")
        .update({ role })
        .eq("id", user.id);

      if (allUserError) {
        console.error("Error updating role:", allUserError);
        setNotification({
          message: `Error updating role: ${allUserError.message || allUserError}`,
          type: "error",
        });
        setUpdating(false);
        return;
      }

      setNotification({
        message: "Role selected successfully! Redirecting...",
        type: "success",
      });

      // Redirect after showing success message
      setTimeout(() => {
        redirectToRole(role);
      }, 1200);
    } catch (err) {
      console.error("Unexpected error:", err);
      setNotification({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
      setUpdating(false);
    }
  };

  // Show loading spinner while fetching user data
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f6fa",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            style={{
              width: 48,
              height: 48,
              color: "#603bbb",
              marginBottom: 18,
              animation: "spin 1s linear infinite",
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#603bbb"
              strokeWidth="4"
              opacity="0.2"
            />
            <path
              d="M22 12c0-5.523-4.477-10-10-10"
              stroke="#603bbb"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <p
            style={{
              color: "#603bbb",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // If user has a role, show nothing (they're being redirected)
  if (hasRole) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f6fa",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            style={{
              width: 48,
              height: 48,
              color: "#603bbb",
              marginBottom: 18,
              animation: "spin 1s linear infinite",
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#603bbb"
              strokeWidth="4"
              opacity="0.2"
            />
            <path
              d="M22 12c0-5.523-4.477-10-10-10"
              stroke="#603bbb"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <p
            style={{
              color: "#603bbb",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // If no user session
  if (!user) {
    return (
      <div className="error-page">
        <p>No active session. Please log in again.</p>
      </div>
    );
  }

  // Show role selection page only if user has NO role
  return (
    <div className="role-selection-page">
      {notification.message && (
        <div
          style={{
            color:
              notification.type === "error" ? "#d32f2f" : "#388e3c",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {notification.message}
        </div>
      )}
      <div className="role-heading">
        {`Hello! Welcome to PathGuider, ${
          firstName || "there"
        }! Kindly let us know what user you are.`}
      </div>

      <div className="role-buttons">
        <button
          onClick={() => handleRole("administrator")}
          disabled={updating}
        >
          Administrator
        </button>
        <button onClick={() => handleRole("teacher")} disabled={updating}>
          Teacher
        </button>
        <button onClick={() => handleRole("student")} disabled={updating}>
          Student
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;