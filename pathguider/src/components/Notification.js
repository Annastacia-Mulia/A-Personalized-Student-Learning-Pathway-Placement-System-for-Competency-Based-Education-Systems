import React from "react";

const Notification = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div className={`notification-popup ${type || "info"}`}> 
      <span>{message}</span>
      <button className="notification-close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Notification;
