// src/components/Login.jsx
import React, { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../utils/firebase";
import { getTestMode } from "../utils/quizSettings";

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(null);

  useEffect(() => {
    getTestMode().then((mode) => setTestMode(mode));
  }, []);

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
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-center text-blue-700 mb-4">
            🎓 Welcome to the Test!
          </h1>
        </div>
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
            <strong>name, registration number, and mobile number</strong> to
            begin.
          </li>
          <li>
            The quiz is <strong>time-based</strong> — you’ll have{" "}
            <span className="text-blue-700 font-medium">20 minutes</span> to
            answer <strong>40 questions</strong>.
          </li>
          <li>
            <span className="text-red-700 font-bold">
              Switching tabs or minimizing the window is strictly prohibited.
            </span>
          </li>
          <li>
            <span className="text-red-700 font-bold">
              Copying any quiz content is strictly prohibited.
            </span>
          </li>
          <li>
            <span className="text-yellow-700 font-semibold">
              If you perform any prohibited action, a warning popup will appear.
              You must read the warning and click the action button to resume
              the quiz within the time mentioned. If you do not respond in time,
              your quiz will be auto-submitted.
            </span>
          </li>
          <li>
            If you close the tab, reload, or relogin by accident, you will{" "}
            <strong>resume where you left off</strong> — but the timer continues
            in the background, including while any proctoring warning popup is
            on screen.{" "}
            <strong>
              Reloading or relogging in is also counted as one tab switch.
            </strong>
          </li>
          <li>
            ⏳ <strong>If the timer runs out</strong>, your quiz will be{" "}
            <strong>automatically submitted</strong>, even if unanswered.
          </li>
          <li>
            At the end, your <strong>score</strong>, <strong>time taken</strong>
            , and the number of <strong>answered</strong> and{" "}
            <strong>unanswered</strong> questions will be shown.
            {testMode === "post" && (
              <>
                {" "}
                You will also see all questions, your answers, and the correct
                answers for each question.
              </>
            )}
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
