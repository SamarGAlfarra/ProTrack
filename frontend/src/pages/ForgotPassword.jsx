import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { sendOTP } from "../axios"; // ✅ Make sure this path is correct
import "./SignIn.css"; // reuse styles
import logo from "../assets/logo2.png";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage("");

    try {
      const result = await sendOTP(email);
      setMessage(result.message); // e.g., "OTP has been sent to your email."
      localStorage.setItem("resetEmail", email); // ✅ store email to use in OTP page
      navigate("/otp"); // move to OTP verification page
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
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
        <p style={{ fontSize: "0.85rem", marginBottom: "1rem", color: "#333" }}>
          Enter your email address and we’ll send you a code to reset your password
        </p>

        <form className="signin-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="signin-btn">Send OTP Code</button>

          {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
          {message && <p style={{ color: "green", marginTop: "0.5rem" }}>{message}</p>}
        </form>

        <p className="signup-text" style={{ marginTop: "1rem" }}>
          <span
            onClick={() => navigate("/signin")}
            className="signup-link"
            style={{ color: "#aa0e0e", cursor: "pointer" }}
          >
            Back to Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;

