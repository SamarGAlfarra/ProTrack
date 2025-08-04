import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { verifyOTP, sendOTP } from "../axios";
import "./SignIn.css";
import logo from "../assets/logo2.png";

function OTP() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [resendMsg, setResendMsg] = useState(null);
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;
    e.target.value = value;

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (!value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const otp = inputsRef.current.map(input => input.value).join("");
    const email = localStorage.getItem("resetEmail");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    try {
      await verifyOTP(email, otp);
      navigate("/resetpassword");
    } catch (err) {
      setError(err.message || "Failed to verify code.");
    }
  };

  const handleResend = async () => {
    const email = localStorage.getItem("resetEmail");
    setResendMsg(null);
    setError(null);

    if (!email) {
      setResendMsg("No email found. Please go back.");
      return;
    }

    try {
      const response = await sendOTP(email);
      setResendMsg(response.message || "A new OTP has been sent.");
    } catch (err) {
      setResendMsg(err.message || "Failed to resend code.");
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
        <p className="otp-instruction">Enter the code which we have sent to your email address</p>

        <form className="signin-form" onSubmit={handleSubmit}>
          <div className="otp-inputs">
            {Array(6).fill().map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                ref={(el) => (inputsRef.current[i] = el)}
                onChange={(e) => handleChange(e, i)}
                className="otp-input"
                required
              />
            ))}
          </div>

          {error && <p className="otp-error">{error}</p>}
          {resendMsg && (
            <p className={`otp-msg ${resendMsg.includes("sent") ? "otp-success" : "otp-fail"}`}>
              {resendMsg}
            </p>
          )}

          <p className="otp-resend" onClick={handleResend}>Resend Code</p>

          <button type="submit" className="signin-btn">Submit</button>

          <p className="otp-back">
            <a href="/" className="otp-link">Back to Home</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default OTP;
