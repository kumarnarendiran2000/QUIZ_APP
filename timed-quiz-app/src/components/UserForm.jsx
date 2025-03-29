// src/components/UserForm.jsx
import React from "react"

const UserForm = ({ userInfo, setUserInfo, onStartQuiz }) => {
  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Enter your details</h2>

      <input
        placeholder="Full Name"
        className="w-full mb-2 p-2 border"
        value={userInfo.name}
        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
      />

      <input
        placeholder="Mobile Number"
        className="w-full mb-4 p-2 border"
        value={userInfo.mobile}
        onChange={(e) => setUserInfo({ ...userInfo, mobile: e.target.value })}
      />

      <button
        onClick={onStartQuiz}
        disabled={!userInfo.name || !userInfo.mobile}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Start Quiz
      </button>
    </div>
  )
}

export default UserForm
