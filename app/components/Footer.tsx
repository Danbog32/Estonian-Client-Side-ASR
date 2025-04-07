// components/Footer.tsx
import React from "react";
import InfoDrawer from "./InfoDrawer";
import { Tooltip } from "@heroui/react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="h-[44px] bg-gray-900">
      <div className="max-w-[1024px] mx-auto h-full px-2 sm:px-6 lg:px-8">
        <div className="flex items-center h-full justify-between">
          <div className="flex-1 ">
            <InfoDrawer />
          </div>
          <div className="flex-1 text-center z-[10]">
            <p className="text-[9px] xs:text-sm text-gray-500">
              &copy; {new Date().getFullYear()} TalTech. All rights reserved.
            </p>
          </div>
          <div className="flex-1 z-[10] flex justify-end">
            <Tooltip content="GitHub Repository">
              <a
                href="https://github.com/Danbog32/Estonian-Client-Side-ASR"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Image
                  src={"images/github-mark.svg"}
                  alt="GitHub"
                  width={24}
                  height={24}
                />
              </a>
            </Tooltip>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
