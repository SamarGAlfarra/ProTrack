import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./SignIn.css";
import logo from "../assets/logo2.png";
import Department from "../components/Department.jsx";

function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    phone_number: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userData = { ...form };
      delete userData.confirmPassword; // not needed by backend

      // degree is no longer sent at all

      await register(userData);

      alert("Registration submitted! Please wait for admin approval.");
      navigate("/signin");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <div className="signin-brand">
          <img src={logo} alt="ProTrack" className="signin-logo" />
          <span className="brand-text">PROTRACK</span>
        </div>
        <h2 className="signin-title">Create Your Account</h2>

        <form className="signin-form" onSubmit={handleSubmit}>
          <input name="id" placeholder="University ID" required onChange={handleChange} />
          <input name="name" placeholder="Full Name" required onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" required onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" required onChange={handleChange} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" required onChange={handleChange} />

          <select name="role" required onChange={handleChange}>
            <option value="">Role</option>
            <option value="student">Student</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>

          {/* Department component should call onChange with { target: { name: 'department', value } } */}
          <Department value={form.department} onChange={handleChange} />

          <input name="phone_number" placeholder="Phone number" required onChange={handleChange} />

          <button type="submit" className="signin-btn">Sign Up</button>
          {error && <p className="error-text">{error}</p>}
        </form>

        <p className="signup-text">
          Already have an account?{" "}
          <span className="signup-link" onClick={() => navigate("/signin")}>
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
