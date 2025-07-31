import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

import homeIcon from "../assets/home.png";
import avatarIcon from "../assets/avatar.png";
import menuIcon from "../assets/menu.png";
import profileIcon from "../assets/profile.png";
import applicationsIcon from "../assets/application.png";
import myprojectsIcon from "../assets/myprojects.png";
import logoutIcon from "../assets/logout.png";

const StudentSideBar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            <h4>Hi, Ssre</h4>
            <p>123456</p>
          </div>
        )}
      </div>

    <nav className="sidebar-nav">
        <Link to="/student-dashboard" className="sidebar-link">
          <img src={homeIcon} alt="Home" className="icon" />
          {!isCollapsed && "Home"}
        </Link>
        <Link to="/student/myprojectsstudent" className="sidebar-link">
          <img src={myprojectsIcon} alt="My Project" className="icon" />
          {!isCollapsed && "MyProject"}
        </Link>
           <Link to="/student/myApplications" className="sidebar-link">
          <img src={applicationsIcon} alt="My Applications" className="icon" />
          {!isCollapsed && "MyApplications"}
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



