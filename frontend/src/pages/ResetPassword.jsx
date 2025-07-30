import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../axios";
import logo from "../assets/logo2.png";
import "./SignIn.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const email = localStorage.getItem("resetEmail");
    if (!email) {
      setError("Email not found. Please go back to the start.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const result = await resetPassword(email, password, confirmPassword);
      setMessage(result.message);
      setTimeout(() => {
        localStorage.removeItem("resetEmail");
        navigate("/signin");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <div className="signin-brand">
          <img src={logo} alt="Logo" className="signin-logo" />
          <span className="brand-text">PROTRACK</span>
        </div>

        <h2 className="signin-title">Reset Your Password</h2>

        <form className="signin-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p style={{ color: "red" }}>{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}

          <button type="submit" className="signin-btn">Update Password</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;