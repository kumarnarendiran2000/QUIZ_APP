// src/components/UserForm.jsx
import React, { useState } from "react"

const UserForm = ({ userInfo, setUserInfo, onStartQuiz }) => {
  const [errors, setErrors] = useState({ name: "", mobile: "" })
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const newErrors = { name: "", mobile: "" }
    const nameRegex = /^[a-zA-Z\s]+$/
    const mobileRegex = /^[0-9]{10}$/

    if (!userInfo.name.trim()) {
      newErrors.name = "Name is required"
    } else if (!nameRegex.test(userInfo.name)) {
      newErrors.name = "Name can only contain letters"
    }

    if (!userInfo.mobile.trim()) {
      newErrors.mobile = "Mobile number is required"
    } else if (!mobileRegex.test(userInfo.mobile)) {
      newErrors.mobile = "Mobile must be 10 digits"
    }

    setErrors(newErrors)
    return !newErrors.name && !newErrors.mobile
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      setSubmitting(true)
      onStartQuiz()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-6 rounded-md shadow-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          💼 Enter Your Details
        </h2>

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

        <div className="mb-6">
          <label className="block text-gray-700 text-lg mb-2" htmlFor="mobile">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="mobile"
            maxLength={10}
            value={userInfo.mobile}
            onChange={(e) => setUserInfo({ ...userInfo, mobile: e.target.value })}
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

        <button
          type="submit"
          disabled={submitting}
          className={`w-full text-white text-lg font-semibold py-3 rounded shadow-md transition duration-200 ${
            submitting
              ? "bg-blue-400 cursor-not-allowed opacity-60"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {submitting ? "Starting quiz, please wait..." : "Start Quiz 🚀"}
        </button>
      </form>
    </div>
  )
}

export default UserForm