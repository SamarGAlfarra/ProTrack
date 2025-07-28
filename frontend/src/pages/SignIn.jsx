import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./SignIn.css";
import logo from "../assets/logo2.png";

function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password); // Call AuthContext

      // ✅ Check approval before navigating
      if (!user.is_approved) {
        setError("Your account is still pending approval by the admin.");
        return;
      }

      // Redirect based on role
      if (user.role === "student") navigate("/student-dashboard");
      else if (user.role === "supervisor") navigate("/supervisor-dashboard");
      else if (user.role === "admin") navigate("/admin-dashboard");
      else navigate("/");
    } catch (err) {
      setError(
        err?.message === "Your account is still pending admin approval."
          ? err.message
          : "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <div className="signin-brand">
          <img src={logo} alt="Logo" className="signin-logo" />
          <span className="brand-text">PROTRACK</span>
        </div>

        <h2 className="signin-title">Sign In To Your Account</h2>

        <form className="signin-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="signin-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember Me
            </label>
            <span
              className="forgot"
              onClick={() => navigate("/forgotpassword")}
              style={{ cursor: "pointer" }}
            >
              FORGOT PASSWORD?
            </span>
          </div>

          {error && (
            <p style={{ color: "red", fontSize: "0.9rem", marginTop: "0.5rem" }}>
              {error}
            </p>
          )}

          <button type="submit" className="signin-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="signup-text">
            Don’t have an account?
            <span
              className="signup-link"
              onClick={() => navigate("/signup")}
              style={{ cursor: "pointer" }}
            >
              {" "}Sign Up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignIn;


