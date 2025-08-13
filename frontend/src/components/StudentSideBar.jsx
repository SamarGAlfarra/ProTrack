import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

import homeIcon from "../assets/home.png";
import avatarIcon from "../assets/avatar.png";
import menuIcon from "../assets/menu.png";
import profileIcon from "../assets/profile.png";
import applicationsIcon from "../assets/application.png";
import myprojectsIcon from "../assets/myprojects.png";
import logoutIcon from "../assets/logout.png";
import axios from "../axios"; // ⬅️ لجلب /me

const StudentSideBar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ⬇️ إضافات لعرض اسم الطالب و ID
  const [firstName, setFirstName] = useState("");
  const [userId, setUserId] = useState("");
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
      } catch (e) {
        if (!mounted) return;
        setFirstName("User");
        setUserId("");
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  // ⬆️ انتهت الإضافات

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
        <img src={avatarIcon} alt="Avatar" className="avatar" />
        {!isCollapsed && (
          <div className="profile-text">
            <h4>Hi, {loadingMe ? "..." : firstName}</h4>
            <p>{loadingMe ? "—" : (userId || "—")}</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <Link to="/student-dashboard" className="sidebar-link">
          <img src={homeIcon} alt="Home" className="icon" />
          {!isCollapsed && "Home"}
        </Link>
        <Link to="/student/myApplications" className="sidebar-link">
          <img src={applicationsIcon} alt="My Applications" className="icon" />
          {!isCollapsed && "MyApplications"}
        </Link>
        <Link to="/student/myprojectsstudent" className="sidebar-link">
          <img src={myprojectsIcon} alt="My Project" className="icon" />
          {!isCollapsed && "MyProject"}
        </Link>

        <Link to="/student/myProfile" className="sidebar-link">
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

export default StudentSideBar;
