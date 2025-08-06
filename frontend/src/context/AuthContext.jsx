// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "../axios"; // make sure axios instance has baseURL:/api and withCredentials:true

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial hydration: get current user from HttpOnly cookie session
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await axios.get("/me"); // cookie sent automatically
        if (mounted) setUser(res.data || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Login: backend sets HttpOnly cookie; we store returned user in state
  const login = async (email, password) => {
    try {
      const { data } = await axios.post("/login", {
        email: String(email || "").trim(),
        password,
      });
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.log("LOGIN ERROR RAW:", err?.response?.status, err?.response?.data);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed";
      throw new Error(message);
    }
  };

  // Logout: invalidate token/cookie on server, then clear local state
  const logout = async () => {
    try {
      await axios.post("/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  // Registration (awaiting admin approval)
  const register = async (data) => {
    try {
      const res = await axios.post("/register", data);
      return res.data; // { message, user }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed";
      throw new Error(message);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("/departments");
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load departments";
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading, // use this in ProtectedRoute to avoid flicker
        setUser,
        login,
        logout,
        register,
        fetchDepartments,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
