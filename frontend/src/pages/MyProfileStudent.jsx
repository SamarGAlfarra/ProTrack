import React, { useEffect, useState } from "react";
import "./Admin.css";
import AdminSidebar from "../components/StudentSideBar";
import editIcon from "../assets/edit.png";
import fallbackAvatar from "../assets/avatar.png";
import closeIcon from "../assets/xbutton.png";
import axios from "../axios"; // baseURL="/api", withCredentials: true

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://127.0.0.1:8000";

const MyProfileStudent = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);

  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);

  // >>> ADDED: track original phone to know if it changed
  const [originalPhone, setOriginalPhone] = useState(""); // <-- ADDED

  // server data
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // image state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null); // blob url
  const [imgLoaded, setImgLoaded] = useState(false);

  // password popup
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // ---------- load profile ----------
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await axios.get("/me");
        setId(data.id ?? "");
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone_number ?? "");

        // >>> ADDED: initialize original phone
        setOriginalPhone(data.phone_number ?? ""); // <-- ADDED

        let url = data.photo_url || "";
        if (url && !url.startsWith("http")) url = API_ORIGIN + url;
        if (url) url += (url.includes("?") ? "&" : "?") + "v=" + Date.now();
        setPhotoUrl(url);
      } catch (e) {
        console.error(e);
        alert("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  // reset loader when the remote photo URL changes
  useEffect(() => {
    setImgLoaded(false);
  }, [photoUrl]);

  // cleanup blob url on unmount
  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // revoke any old blob
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);

    setPhotoFile(file);
    setImgLoaded(false);

    // instant local preview
    const blobUrl = URL.createObjectURL(file);
    setPhotoPreview(blobUrl);
  };

  const handleSaveBoth = async () => {
  setSaving(true);
  setError(null);

  // Build the tasks we actually need to run
  const tasks = [];
  if (phone !== originalPhone) {
    tasks.push({
      key: "phone",
      p: axios.put("/me", { phone_number: phone }),
    });
  }
  if (photoFile) {
    const form = new FormData();
    form.append("photo", photoFile);
    tasks.push({
      key: "photo",
      p: axios.post("/me/photo", form),
    });
  }

  if (tasks.length === 0) {
    alert("No changes to save.");
    setSaving(false);
    return;
  }

  try {
    const results = await Promise.allSettled(tasks.map(t => t.p));

    let phoneOK = false, photoOK = false, photoMsg = "", phoneMsg = "";

    results.forEach((res, i) => {
      const key = tasks[i].key;
      if (res.status === "fulfilled") {
        if (key === "phone") {
          const data = res.value.data;
          setPhone(data.phone_number ?? "");
          setOriginalPhone(data.phone_number ?? ""); // mark as saved
          phoneOK = true;
          phoneMsg = "Phone updated";
        } else if (key === "photo") {
          const data = res.value.data;
          const raw = data.photo_url || "";
          const absolute = raw.startsWith("http") ? raw : API_ORIGIN + raw;
          const freshUrl = `${absolute}${absolute.includes("?") ? "&" : "?"}v=${Date.now()}`;
          setPhotoUrl(freshUrl);
          // keep preview until <img> loads, then your onLoad will clear it
          setPhotoFile(null);

          // >>> ADDED: clear the file input so the same file can be chosen again
          const input = document.querySelector('input[type="file"]'); // <-- ADDED
          if (input) input.value = ""; // <-- ADDED

          photoOK = true;
          photoMsg = "Photo updated";
        }
      } else {
        const errMsg =
          res.reason?.response?.data?.message ||
          res.reason?.message ||
          "Request failed";
        if (key === "phone") phoneMsg = `Phone failed: ${errMsg}`;
        if (key === "photo") photoMsg = `Photo failed: ${errMsg}`;
      }
    });

    // Friendly summary
    if (phoneOK && photoOK) alert("Profile updated (phone + photo).");
    else if (phoneOK || photoOK) alert([phoneMsg, photoMsg].filter(Boolean).join(" | "));
    else alert("Nothing was updated. Please try again.");
  } catch (e) {
    console.error(e);
    setError(e?.response?.data?.message || "Failed to update profile");
  } finally {
    setSaving(false);
  }
};

  const handleSavePhoto = async () => {
    if (!photoFile) return alert("Choose a photo first.");
    try {
      const form = new FormData();
      form.append("photo", photoFile);

      const { data } = await axios.post("/me/photo", form);

      const raw = data.photo_url || "";
      const absolute = raw.startsWith("http") ? raw : API_ORIGIN + raw;
      const freshUrl = `${absolute}${absolute.includes("?") ? "&" : "?"}v=${Date.now()}`;
      setPhotoUrl(freshUrl);

      setPhotoFile(null);
      alert("Photo updated!");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to update photo");
    }
  };

  // ---------- phone only ----------
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.put("/me", { phone_number: phone });
      setPhone(data.phone_number ?? "");
      alert("Phone number updated!");
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "Failed to update phone number";
      setError(msg);
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

  // Always show preview if it exists; otherwise remote; otherwise fallback
  const effectiveSrc = photoPreview || photoUrl || fallbackAvatar;

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
            <img
              key={photoUrl} // re-render on network URL change
              src={effectiveSrc}
              alt="Profile"
              className="profile-image"
              onLoad={() => {
                setImgLoaded(true);
                // Once the network image (photoUrl) has loaded, drop the blob preview
                if (photoPreview?.startsWith("blob:") && effectiveSrc === photoUrl) {
                  URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(null);
                }
              }}
              onError={(e) => {
                console.warn("Image failed:", e.currentTarget.src);
                if (photoPreview) e.currentTarget.src = photoPreview;
                else e.currentTarget.src = fallbackAvatar;
              }}
            />
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

          <div className="profile-name-container">
            <span>{name || "—"}</span>
          </div>
        </div>

        <div className="form-group">
          <label>ID</label>
          <input type="text" className="profile-input" value={id} readOnly />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" className="profile-input" value={email} readOnly />
        </div>

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
          <button className="save-btn" onClick={handleSaveBoth} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
{/*           <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="save-btn" onClick={handleSavePhoto} disabled={!photoFile}>
            Save Photo
          </button> */}
          {error && <p className="error">{error}</p>}
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

export default MyProfileStudent;
