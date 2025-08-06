import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Header.css";

function Header() {
  return (
    <header className="navbar">
      <Link to="/">
        <img src={logo} alt="ProTrack Logo" className="logo" />
      </Link>

      <nav className="nav-links">
        <Link className="nav-btn" to="/">Home</Link>
        <Link className="nav-btn" to="/about">About</Link>
        <Link className="nav-btn" to="/features">Features</Link>

        <div className="auth-buttons">
          <Link className="login" to="/signin">Sign In</Link>
          <Link className="signup" to="/signup">Sign Up</Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;
