
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import TotpVerify from "../../components/TotpVerify";


const AuthCallback = () => {
  const navigate = useNavigate();
  const [showTotp, setShowTotp] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [totpChecked, setTotpChecked] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      const user = session.user;

      // Check if user already has a role
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      // Insert user into 'users' and 'all_users' tables if not present
      if (!profile) {
        const userData = {
          id: user.id,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          email: user.email,
          role: null
        };
        await supabase.from("users").insert(userData);
        await supabase.from("all_users").insert(userData);
      }

      // Check for verified TOTP factor
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const hasTotp = factorsData?.all?.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );

      if (hasTotp) {
        setShowTotp(true);
        setUserRole(profile?.role || "");
      } else {
        // No TOTP, proceed as before
        if (profile && profile.role) {
          navigate(`/${profile.role}`);
        } else {
          navigate("/roleSelection");
        }
      }
      setTotpChecked(true);
    };
    handleAuthCallback();
  }, [navigate]);

  // After successful TOTP verification, redirect to correct homepage
  const handleTotpSuccess = async () => {
    if (userRole === "student") {
      navigate("/studentHome");
    } else if (userRole === "teacher") {
      navigate("/teacherHome");
    } else if (userRole === "admin") {
      navigate("/adminHome");
    } else {
      navigate("/roleSelection");
    }
  };

  if (showTotp && totpChecked) {
    return <TotpVerify supabase={supabase} onSuccess={handleTotpSuccess} />;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "2rem", color: "#fff" }}>
      Completing sign-in…
    </div>
  );
};

export default AuthCallback;


