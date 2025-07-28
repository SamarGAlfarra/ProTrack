import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./index.css";
import { AuthProvider } from "./context/AuthContext"; // ⬅️ import the context

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider> {/* ⬅️ wrap RouterProvider */}
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

