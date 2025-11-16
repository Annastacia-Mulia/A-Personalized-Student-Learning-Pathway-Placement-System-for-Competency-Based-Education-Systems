import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="landing-bg" style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'2rem 3rem 1rem 3rem'}}>
        <div style={{fontWeight:700,fontSize:32,color:'#603bbb',letterSpacing:1}}>PathGuider</div>
        <div style={{display:'flex',gap:12}}>
          <button className="landing-btn" onClick={()=>navigate('/login')}>Sign In</button>
          <button className="landing-btn" onClick={()=>navigate('/signup')}>Sign Up</button>
        </div>
      </header>
      <main style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 2rem',width:'100%'}}>
        <div style={{display:'flex',justifyContent:'center',alignItems:'flex-start',gap:48,marginTop:48,flexWrap:'wrap',width:'100%'}}>
          <div style={{maxWidth:700,minWidth:320,flex:1}}>
            <h1 style={{fontSize:48,color:'#fff',marginBottom:24}}>Welcome to PathGuider</h1>
            <p style={{maxWidth:700,fontSize:20,lineHeight:1.6,marginBottom:32,color:'#fff'}}>
              In the current Kenyan education system, students are following the CBC education system. This requires them to be placed into different pathways; STEM, Arts and Sports, and Social Sciences. PathGuider aims to place students in pathways that are best for students, by considering their grades as well as student interests. This ensures that students are placed in pathways where they will excel perfectly. <br /><br />
              PathGuider is the best choice for students, teachers and school administrators for pathway placements.
            </p>
          </div>
          <div className="masonry-landing-grid" style={{flex:1,maxWidth:420,minWidth:220}}>
            <img src="/landing/analytics.jpeg" alt="analytics" className="masonry-img" />
            <img src="/landing/class.jpeg" alt="class" className="masonry-img" />
            <img src="/landing/ipad.jpeg" alt="ipad" className="masonry-img" />
            <img src="/landing/books.jpeg" alt="books" className="masonry-img" />
            <img src="/landing/study.jpeg" alt="study" className="masonry-img" />
            <img src="/landing/book3.jpeg" alt="book3" className="masonry-img" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
