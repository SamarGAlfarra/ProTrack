import React, { useEffect, useState } from "react";
import "./Admin.css";
import AdminSidebar from "../components/AdminSideBar";
import editIcon from "../assets/edit.png";
import fallbackAvatar from "../assets/avatar.png";
import closeIcon from "../assets/xbutton.png";
import axios from "../axios"; // baseURL="/api", withCredentials: true

const MyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);

  // server data
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // local photo preview/file
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // password popup state
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await axios.get("/me");
        setId(data.id ?? "");
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone_number ?? "");
        setPhotoUrl(data.photo_url ?? "");
      } catch (e) {
        console.error(e);
        alert("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append("phone_number", phone || "");
      if (photoFile) form.append("photo", photoFile);

      console.log("sending update:", { phone, hasPhoto: !!photoFile });
      const { data } = await axios.put("/me", form);
      console.log("updateMe response:", data);



      setPhone(data.phone_number ?? "");
      setPhotoUrl(data.photo_url ?? "");
      setPhotoFile(null);
      setPhotoPreview(null);
      alert("Profile updated.");
    } catch (e) {
      if (e.response?.status === 422) {
        const errs = e.response.data?.errors || {};
        alert(Object.values(errs).flat().join('\n'));
      } else {
        alert(e.response?.data?.message || 'Update failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await axios.post("/reset-password", {
        password: newPass,
        password_confirmation: confirmPass,
      });
      alert("Password changed. A confirmation email was sent.");
      setShowResetPopup(false);
      setNewPass("");
      setConfirmPass("");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Password change failed.");
    }
  };

  const avatarToShow = photoPreview || photoUrl || fallbackAvatar;

  if (loading) {
    return (
      <div className="admin-dashboard">
        <AdminSidebar />
        <div className="dashboard-content">Loading…</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <div className="dashboard-content my-profile-container">
        <h2 className="section-title">My Profile</h2>

        <div className="profile-header">
          <div className="profile-image-wrapper">
            <img src={avatarToShow} alt="Profile" className="profile-image" />
            <label className="edit-photo-icon">
              <img src={editIcon} alt="Edit" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Show the user's name beside the photo */}
          <div className="profile-name-container">
            <span>{name || "—"}</span>
          </div>
        </div>

        {/* ID fixed/read-only */}
        <div className="form-group">
          <label>ID</label>
          <input type="text" className="profile-input" value={id} readOnly />
        </div>

        {/* Email shown (read-only) */}
        <div className="form-group">
          <label>Email</label>
          <input type="email" className="profile-input" value={email} readOnly />
        </div>

        {/* Editable phone number */}
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            className="profile-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0501234567"
          />
        </div>

        <div className="bottom-buttons">
          <span className="reset-password-link" onClick={() => setShowResetPopup(true)}>
            Reset Password
          </span>
          <button className="save-button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
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

              <input
                type="password"
                placeholder="New Password"
                className="profile-input"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="profile-input"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />

              <button className="add-admin-btn" onClick={handlePasswordReset}>
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
