// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "../axios"; // shared axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ hydration flag

  useEffect(() => {
    try { localStorage.removeItem('token'); } catch {}
  }, []);


  // ✅ Hydrate user on first load (reads JWT from HttpOnly cookie)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/me"); // cookie is sent automatically
        if (mounted) setUser(res.data);
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

  // ✅ Login: server sets the HttpOnly cookie; we just store the returned user
  const login = async (email, password) => {
    const response = await axios.post("/login", { email, password });
    const { user } = response.data;

    if (!user?.is_approved) {
      throw { message: "Your account is still pending admin approval." };
    }

    setUser(user); // no localStorage
    return user;
  };

  // ✅ Logout: invalidate server token & clear user
  const logout = async () => {
    try {
      await axios.post("/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  const register = async (data) => {
    const response = await axios.post("/register", data);
    return response.data; // { message, user }
  };

  const fetchDepartments = async () => {
    const response = await axios.get("/departments");
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,        // expose loading for ProtectedRoute
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
