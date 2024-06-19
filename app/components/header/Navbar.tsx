"use client";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
} from "@nextui-org/react";
import { TalTechLogo } from "./TalTechLogo.jsx";
import { Icons } from "../icons";
import Settings from "./Settings"; // Adjust the path as necessary

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = [
    "Profile",
    "Dashboard",
    "Activity",
    "Analytics",
    "System",
    "Deployments",
    "My Settings",
    "Team Settings",
    "Help & Feedback",
    "Log Out",
  ];

  return (
    <Navbar
      onMenuOpenChange={setIsMenuOpen}
      className="bg-gray-900 bg-opacity-85"
    >
      <NavbarContent>
        {/* <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        /> */}
        <NavbarBrand>
          <TalTechLogo />
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <button
            id="startBtn"
            disabled
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded transition duration-300 disabled:opacity-50 flex items-center gap-1"
          >
            <Icons.play size={20} color="white" />
            Start
          </button>
        </NavbarItem>
        <NavbarItem>
          <button
            id="stopBtn"
            disabled
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition duration-300 disabled:opacity-50 flex items-center gap-1"
          >
            <Icons.stop size={21} color="white" />
            Stop
          </button>
        </NavbarItem>
        <NavbarItem>
          <button
            id="clearBtn"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded transition duration-300 flex items-center gap-1"
          >
            <Icons.delete size={21} color="white" />
            Clear
          </button>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Settings />
        </NavbarItem>
      </NavbarContent>
      {/* <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              color={
                index === 2
                  ? "primary"
                  : index === menuItems.length - 1
                  ? "danger"
                  : "foreground"
              }
              className="w-full"
              href="#"
              size="lg"
            >
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu> */}
    </Navbar>
  );
}
