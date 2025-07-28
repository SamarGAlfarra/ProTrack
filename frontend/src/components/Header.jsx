import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Header.css";

function Header() {
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <img src={logo} alt="ProTrack Logo" className="logo" />

      <nav className="nav-links">
        <a href="#">Home</a>
        <a href="#">About</a>
        <a href="#">Features</a>

        <div className="auth-buttons"> 
          <button className="login" onClick={() => navigate("/signin")}>
            Sign In
          </button>
          <button className="signup" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;





