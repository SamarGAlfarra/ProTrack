import React, { useState } from 'react';
import './Admin.css';
import AdminSidebar from '../components/AdminSideBar';
import editIcon from '../assets/edit.png';
import profilePhoto from '../assets/avatar.png';
import closeIcon from '../assets/xbutton.png';

const MyProfile = () => {
  const [showResetPopup, setShowResetPopup] = useState(false);
  const [name, setName] = useState("Ahmed Mahdi");
  const [isEditingName, setIsEditingName] = useState(false);
  const [photo, setPhoto] = useState(profilePhoto);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result); // base64 image preview
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <div className="dashboard-content my-profile-container">
        <h2 className="section-title">My Profile</h2>

        <div className="profile-header">
          <div className="profile-image-wrapper">
            <img src={photo} alt="Profile" className="profile-image" />
            <label className="edit-photo-icon">
              <img src={editIcon} alt="Edit" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="profile-name-container">
            {isEditingName ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                className="profile-name-input"
              />
            ) : (
              <>
                <span>{name}</span>
                <img
                  src={editIcon}
                  alt="Edit"
                  className="action-icon"
                  onClick={() => setIsEditingName(true)}
                />
              </>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>ID</label>
          <input type="text" className="profile-input" />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="text" className="profile-input" />
        </div>

        <div className="bottom-buttons">
          <span className="reset-password-link" onClick={() => setShowResetPopup(true)}>
            Reset Password
          </span>
          <button className="save-button">Save</button>
        </div>

        {showResetPopup && (
          <div className="reset-password-modal">
            <div className="reset-password-box">
              <div className="reset-header">
                <h3>Reset Password</h3>
                <img
                  src={closeIcon}
                  alt="Close"
                  className="close-icon"
                  onClick={() => setShowResetPopup(false)}
                />
              </div>
              <input type="password" placeholder="New Password" className="profile-input" />
              <input type="password" placeholder="Confirm New Password" className="profile-input" />
              <button className="add-admin-btn">Confirm</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;

