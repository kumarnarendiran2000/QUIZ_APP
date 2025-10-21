// src/components/UserForm.jsx
import React, { useState } from "react";

const UserForm = ({ userInfo, setUserInfo, onStartQuiz, isLoading = false }) => {
  const [errors, setErrors] = useState({ name: "", mobile: "", regno: "" });
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = { name: "", mobile: "", regno: "" };
    const nameRegex = /^[a-zA-Z\s]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    const regnoRegex = /^[A-Za-z0-9-/]+$/; // Accepts alphanumeric, dash, slash

    if (!userInfo.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!nameRegex.test(userInfo.name)) {
      newErrors.name = "Name can only contain letters";
    }

    if (!userInfo.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!mobileRegex.test(userInfo.mobile)) {
      newErrors.mobile = "Mobile must be 10 digits";
    }

    if (!userInfo.regno || !userInfo.regno.trim()) {
      newErrors.regno = "Registration Number is required";
    } else if (!regnoRegex.test(userInfo.regno)) {
      newErrors.regno = "Invalid Registration Number format";
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.mobile && !newErrors.regno;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setSubmitting(true);
      onStartQuiz();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-6 rounded-md shadow-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          💼 Enter Your Details
        </h2>

        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-gray-700 text-lg mb-2" htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={userInfo.name}
            onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
            className={`w-full px-4 py-2 rounded border text-lg focus:outline-none ${
              errors.name
                ? "border-red-500 bg-red-50"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Registration Number Field (moved up) */}
        <div className="mb-4">
          <label className="block text-gray-700 text-lg mb-2" htmlFor="regno">
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="regno"
            value={userInfo.regno || ""}
            onChange={(e) =>
              setUserInfo({ ...userInfo, regno: e.target.value })
            }
            className={`w-full px-4 py-2 rounded border text-lg focus:outline-none ${
              errors.regno
                ? "border-red-500 bg-red-50"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
          {errors.regno && (
            <p className="text-red-600 text-sm mt-1">{errors.regno}</p>
          )}
        </div>

        {/* Mobile Field */}
        <div className="mb-6">
          <label className="block text-gray-700 text-lg mb-2" htmlFor="mobile">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="mobile"
            maxLength={10}
            value={userInfo.mobile}
            onChange={(e) =>
              setUserInfo({ ...userInfo, mobile: e.target.value })
            }
            className={`w-full px-4 py-2 rounded border text-lg focus:outline-none ${
              errors.mobile
                ? "border-red-500 bg-red-50"
                : "border-gray-300 focus:border-blue-500"
            }`}
          />
          {errors.mobile && (
            <p className="text-red-600 text-sm mt-1">{errors.mobile}</p>
          )}
        </div>

        <p className="text-sm text-left mt-4 mb-6 text-gray-600 italic border-l-4 border-blue-400 pl-4 bg-blue-50 rounded-md py-3">
          By continuing, you agree to the collection of your name, email,
          registration number and mobile number for test participation. This
          data is stored securely and not shared.
        </p>

        <button
          type="submit"
          disabled={submitting || isLoading}
          className={`w-full text-white text-lg font-semibold py-3 rounded shadow-md transition duration-200 ${
            submitting || isLoading
              ? "bg-blue-400 cursor-not-allowed opacity-60"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {submitting || isLoading 
            ? "Loading quiz, please wait..." 
            : "Start Test 🚀"}
        </button>
      </form>
    </div>
  );
};

export default UserForm;
