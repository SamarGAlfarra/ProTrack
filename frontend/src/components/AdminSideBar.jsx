import React, { useState, useEffect } from 'react';
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
import api from '../axios'; // <-- your configured axios with withCredentials

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/me'); // cookie is sent automatically
        if (!mounted) return;
        setMe(data);
      } catch (err) {
        // optional: redirect to login if unauthorized
        // navigate('/signin');
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLogout = () => {
    // call your logout endpoint if you have one; or just reload to clear cookie scope
    alert("Logging out...");
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  const firstName = (me?.name || '').split(' ')[0] || '';

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
        {/* ADDED: show user's photo if present, otherwise the default avatar */}
        <img
          src={me?.photo_url ? me.photo_url : avatarIcon}
          alt="Avatar"
          className="avatar"
        />
        {!isCollapsed && (
          <div className="profile-text">
            <h4>
              {loadingMe ? 'Hi, ...' : `Hi, ${firstName || 'User'}`}
            </h4>
            <p>{loadingMe ? '...' : me?.id}</p>
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
