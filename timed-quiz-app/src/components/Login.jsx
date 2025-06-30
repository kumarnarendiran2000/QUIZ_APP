// src/components/Login.jsx
import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../utils/firebase";

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err) {
      console.error("Login failed:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-4">
          🎓 Welcome to the Pharmacovigilance Quiz!
        </h1>
        <p className="text-center text-gray-600 mb-6 text-lg">
          Please read the instructions carefully before starting.
        </p>

        <ol className="list-decimal list-inside space-y-3 text-gray-700 text-base leading-relaxed">
          <li>
            First, you must log in with your <strong>Google account</strong> to
            proceed.
          </li>
          <li>
            After logging in, fill in your{" "}
            <strong>name and mobile number</strong> to begin.
          </li>
          <li>
            The quiz is <strong>time-based</strong> — you’ll have{" "}
            <span className="text-blue-700 font-medium">10 minutes</span> to
            answer <strong>10 questions</strong>.
          </li>
          <li>
            <span className="text-red-700 font-bold">
              Switching tabs or minimizing the window is strictly prohibited.
            </span>{" "}
            If you do, a warning popup will appear with a{" "}
            <strong>20-second countdown</strong>. You have{" "}
            <strong>10 tab switch attempts</strong> in total. If you reach 0
            attempts, your quiz will be{" "}
            <span className="font-bold">auto-submitted</span>.
          </li>
          <li>
            <span className="text-red-700 font-bold">
              Copying any quiz content is also strictly prohibited.
            </span>{" "}
            Each copy attempt triggers a warning popup. You have{" "}
            <strong>10 copy attempts</strong> in total. On the 10th attempt,
            your quiz will be <span className="font-bold">auto-submitted</span>.
          </li>
          <li>
            During a warning popup, you must click the respective <strong>action button</strong> to resume the test within <strong>20 seconds</strong>. Failing to do so will also auto-submit your quiz.
          </li>
          <li>
            If you close the tab, reload, or relogin by accident, you will <strong>resume where you left off</strong> — but the timer continues in the background, including while any proctoring warning popup is on screen, and your proctoring attempt counts are restored. <strong>Reloading or relogging in is also counted as one tab switch and deducted from your tab switch attempts.</strong>
          </li>
          <li>
            ⏳ <strong>If the timer runs out</strong>, your quiz will be{" "}
            <strong>automatically submitted</strong>, even if unanswered.
          </li>
          <li>
            At the end, your{" "}
            <strong>score, time taken, and the correct answers</strong> will be
            shown.
          </li>
          <li>
            ✅ Once you're ready, click the button below to log in and begin!
          </li>
        </ol>

        <div className="mt-8 text-center">
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 px-6 rounded shadow-md transition duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {loading
              ? "Signing you inn, please wait..."
              : "🔐 Authnticate with Google"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
