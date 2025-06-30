// src/components/Layout.jsx
import React from "react";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-blue-200 shadow-md py-4 px-6">
        <div className="flex items-center justify-center max-w-5xl mx-auto gap-4 sm:gap-8">
          {/* Left Logo - reduced size and close to text */}
          <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
            <img
              src="/NET-Medical-College.png"
              alt="NET Medical College Logo"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          {/* Title - vertically centered next to logo */}
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-900 leading-tight">
              Navodaya Medical College Quiz App
            </h1>
            <p className="text-sm sm:text-base text-gray-700 -mt-1">
              {/* Optionally add subtitle here */}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-blue-100 text-blue-900 text-sm text-center py-4 mt-6">
        © {new Date().getFullYear()} Navodaya Medical College. All rights
        reserved.
      </footer>
    </div>
  );
};

export default Layout;
