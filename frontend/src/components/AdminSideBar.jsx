import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

import homeIcon from "../assets/home.png";
import adminIcon from "../assets/admin.png";
import supervisorIcon from "../assets/supervisor.png";
import studentIcon from "../assets/student.png";
import avatarIcon from "../assets/avatar.png";
import menuIcon from "../assets/menu.png";
import profileIcon from "../assets/profile.png";
import logoutIcon from "../assets/logout.png";

const AdminSidebar = () => {
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
        <Link to="/admin/request" className="sidebar-link">
          <img src={homeIcon} alt="Home" className="icon" />
          {!isCollapsed && "Home"}
        </Link>
        <Link to="/admin/admins" className="sidebar-link">
          <img src={adminIcon} alt="Admins" className="icon" />
          {!isCollapsed && "All Admins"}
        </Link>
        <Link to="/admin/supervisors" className="sidebar-link">
          <img src={supervisorIcon} alt="Supervisors" className="icon" />
          {!isCollapsed && "All Supervisors"}
        </Link>
        <Link to="/admin/students" className="sidebar-link">
          <img src={studentIcon} alt="Students" className="icon" />
          {!isCollapsed && "All Students"}
        </Link>
        <Link to="/admin/MyProfile" className="sidebar-link">
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

export default AdminSidebar;



