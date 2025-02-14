// components/Footer.tsx
import React from "react";
import InfoDrawer from "./InfoDrawer";

const Footer = () => {
  return (
    <footer className="h-[44px] bg-gray-900">
      <div className="max-w-[1024px] mx-auto h-full px-2 sm:px-6 lg:px-8">
        <div className="flex items-center h-full">
          <div className="flex-1 ">
            <InfoDrawer />
          </div>
          <div className="flex-1 text-center">
            <p className="text-sm text-gray-500 text-nowrap max-[300px]:text-wrap">
              &copy; 2025 TalTech. All rights reserved.
            </p>
          </div>
          <div className="flex-grow-0 sm:flex-1" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
