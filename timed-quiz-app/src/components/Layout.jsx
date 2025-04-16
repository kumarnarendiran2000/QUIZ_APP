// src/components/Layout.jsx
import React from "react";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-blue-200 shadow-md py-4 px-6">
        <div className="flex items-center justify-center space-x-4">
          <img
            src="/ISA_Raichur_logo_enhanced.png" // You must place this in your `public/` folder
            alt="ISA Raichur Logo"
            className="h-20 w-20 object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
              Indian Society of Anaesthesiologists
            </h1>
            <p className="text-sm sm:text-base text-gray-700 -mt-1">
              (Karnataka State Chapter)
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              www.isakarnataka.org
            </p>
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
