import React from "react";

const Home = ({ handleLogout }) => {
  return (
    <section className="hero">
      <nav>
        <h2>Welcome to PathGuider!</h2>
        <button onClick={handleLogout}>Log Out</button>
      </nav>
    </section>
  );
};

export default Home;
