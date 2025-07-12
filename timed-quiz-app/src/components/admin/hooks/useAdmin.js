// src/components/admin/hooks/useAdmin.js
import { useContext } from "react";
import AdminContext from "../AdminContext";

// Custom hook for using the context
const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export default useAdmin;
