import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

import homeIcon from "../assets/home.png";
import avatarIcon from "../assets/avatar.png";
import menuIcon from "../assets/menu.png";
import profileIcon from "../assets/profile.png";
import myprojectsIcon from "../assets/myprojects.png";
import logoutIcon from "../assets/logout.png";
import axios from "../axios"; // ⬅️ لجلب بيانات /me

const SupervisorSideBar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ⬇️ بيانات المشرف
  const [firstName, setFirstName] = useState("");
  const [userId, setUserId] = useState("");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get("/me", { withCredentials: true });
        if (!mounted) return;
        const name = data?.name || "";
        setFirstName((name || "").split(" ")[0] || "User");
        setUserId(data?.id ?? "");
        setPhotoUrl(data?.photo_url ?? null);
      } catch (e) {
        if (!mounted) return;
        setFirstName("User");
        setUserId("");
        setPhotoUrl(null);
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    alert("Logging out...");
    setTimeout(() => {
      navigate("/");
    }, 100); 
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img
          src={menuIcon}
          alt="Menu"
          className="menu-icon"
          onClick={toggleSidebar}
        />
      </div>

      <div className="profile-box">
        {/* ✅ صورة المشرف أو الافتراضية */}
        <img 
          src={photoUrl ? photoUrl : avatarIcon} 
          alt="Avatar" 
          className="avatar" 
        />
        {!isCollapsed && (
          <div className="profile-text">
            <h4>Hi, {loadingMe ? "..." : firstName}</h4>
            <p>{loadingMe ? "—" : (userId || "—")}</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <Link to="/supervisor-dashboard" className="sidebar-link">
          <img src={homeIcon} alt="Home" className="icon" />
          {!isCollapsed && "Home"}
        </Link>
        <Link to="/supervisor/myprojects" className="sidebar-link">
          <img src={myprojectsIcon} alt="My Projects" className="icon" />
          {!isCollapsed && "MyProjects"}
        </Link>

        <Link to="/supervisor/MyProfile" className="sidebar-link">
          <img src={profileIcon} alt="profile" className="icon" />
          {!isCollapsed && "My Profile"}
        </Link>

        <div className="sidebar-link" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <img src={logoutIcon} alt="logout" className="icon" />
          {!isCollapsed && "Logout"}
        </div>
      </nav>
    </div>
  );
};

export default SupervisorSideBar;
