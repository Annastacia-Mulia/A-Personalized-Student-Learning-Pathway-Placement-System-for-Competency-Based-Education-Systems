import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get session after redirect from Google
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Get user info
      const user = session.user;

      // Check if user already has a role
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && profile.role) {
        // Role already set → redirect to their home page
        navigate(`/${profile.role}`);
      } else {
        // No role yet → go to role selection
        navigate("/roleSelection");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem", color: "#fff" }}>
      Completing sign-in…
    </div>
  );
};

export default AuthCallback;

