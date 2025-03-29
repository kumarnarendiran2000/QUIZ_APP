// src/components/Login.jsx
import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";

const Login = ({ onLogin }) => {
  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err) {
      console.error("Login Failed", err);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={signIn}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Sign in with Google to start
      </button>
    </div>
  );
};

export default Login;
