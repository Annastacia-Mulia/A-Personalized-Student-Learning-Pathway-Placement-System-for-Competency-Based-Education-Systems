import React from "react";

const Modal = ({ open, title, children, onClose }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 10,
        minWidth: 320,
        maxWidth: 400,
        padding: 32,
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        position: "relative"
      }}>
        <button onClick={onClose} style={{position:'fixed',top:'calc(50% - 200px)',right:'calc(50% - 200px)',fontSize:24,background:'none',border:'none',color:'#603bbb',cursor:'pointer',lineHeight:'1',padding:0,zIndex:1100}} aria-label="Close">×</button>
        <h2 style={{marginTop:0,marginBottom:16,color:'#603bbb',fontSize:22}}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
