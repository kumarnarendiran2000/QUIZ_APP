// src/components/Layout.jsx
import React from "react"

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-blue-200 shadow-md py-4 px-6">
        <div className="flex items-center justify-center space-x-4">
            <img
            src="https://navodayahospital.co.in/wp-content/uploads/2021/04/Hospital-logo.png"
            alt="Navodaya Logo"
            className="h-18 w-40 object-contain rounded-lg"
            />
            <h1 className="text-2xl font-bold text-black-700 text-center">
            Navodaya Medical College Hospital & Research Centre Quiz Portal
            </h1>
        </div>
    </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-600 text-sm text-center py-4 mt-6">
        © {new Date().getFullYear()} Navodaya Medical College Hospital & Research Centre. All rights reserved.
      </footer>
    </div>
  )
}

export default Layout