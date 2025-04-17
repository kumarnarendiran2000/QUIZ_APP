// src/components/Layout.jsx
import React from "react";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-blue-200 shadow-md py-4 px-6">
        <div className="flex items-center justify-center space-x-4 sm:space-x-8">
          {/* Left Logo */}
          <div className="w-24 h-24 flex items-center justify-center">
            <img
              src="/ISA_Raichur_logo_final.png"
              alt="ISA Raichur Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl font-bold text-blue-900 leading-tight">
              Indian Society of Anaesthesiologists
            </h1>
            <p className="text-sm sm:text-base text-gray-700 -mt-1">
              (Karnataka State Chapter)
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              www.isakarnataka.org
            </p>
          </div>

          {/* Right Logo */}
          <div className="w-20 h-20 flex items-center justify-center">
            <img
              src="/ISA_Karnataka_logo_final.png"
              alt="ISA Karnataka Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-blue-100 text-blue-900 text-sm text-center py-4 mt-6">
        © {new Date().getFullYear()} Indian Society of Anaesthesiologists –
        Karnataka State Chapter. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
