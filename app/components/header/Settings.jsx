"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
} from "@nextui-org/react";
import { Icons } from "../icons";
import { useSettings } from "../SettingsContext"; // Adjust the path as necessary

export default function Settings() {
  const { textSize, setTextSize, lineHeight, setLineHeight, subtitleMode, setSubtitleMode } = useSettings();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [backdrop, setBackdrop] = React.useState("opaque");
  const [zoomApiToken, setZoomApiToken] = useState(""); // Add state for the Zoom API token

  const handleOpen = () => {
    setBackdrop("opaque");
    onOpen();
  };

  const handleTextSizeChange = (increment) => {
    setTextSize((prevSize) => {
      const newSize = increment ? prevSize + 0.5 : prevSize - 0.5;
      return Math.max(1, Math.min(newSize, 8));
    });
  };

  const handleLineHeightChange = (increment) => {
    setLineHeight((prevHeight) => {
      const newHeight = increment ? prevHeight + 0.1 : prevHeight - 0.1;
      return Math.max(1, Math.min(newHeight, 3));
    });
  };

  const handleModeChange = (mode) => {
    setSubtitleMode(mode === "subtitle");
    // Update the global subtitle mode in app-asr.js
    window.setSubtitleMode(mode === "subtitle");
  };

  const handleSaveZoomToken = () => {
    if (zoomApiToken) {
      // Send the token to the app-asr.js file
      window.setApiSettings(zoomApiToken); // Assuming this function exists in app-asr.js
      alert("Zoom API token saved successfully!");
    } else {
      alert("Please enter a valid Zoom API token.");
    }
  };

  return (
    <div className="dark">
      <div className="flex flex-wrap gap-0 sm:gap-3">
        <Button
          variant="bordered"
          onClick={handleOpen}
          color="light"
          className="text-white bg-gray-900 hover:bg-gray-800 transition duration-100 gap-1 min-w-0"
        >
          <Icons.settings size={20} color="white" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </div>
      <Modal backdrop={backdrop} isOpen={isOpen} onClose={onClose}>
        <ModalContent className="bg-gray-800 text-white">
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-white">
                Settings
              </ModalHeader>
              <ModalBody className="text-gray-300">
                <div className="flex flex-col gap-4 mb-4">
                  <span>Text Size:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="bordered"
                      onClick={() => handleTextSizeChange(false)}
                      className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      isDisabled
                      variant="bordered"
                      value={textSize.toFixed(1)}
                      size="small"
                      onChange={(e) =>
                        setTextSize(
                          Math.max(1, Math.min(parseFloat(e.target.value), 8))
                        )
                      }
                    />
                    <Button
                      variant="bordered"
                      onClick={() => handleTextSizeChange(true)}
                      className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                    >
                      +
                    </Button>
                  </div>
                  <span>Line Height:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="bordered"
                      onClick={() => handleLineHeightChange(false)}
                      className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      isDisabled
                      variant="bordered"
                      value={lineHeight.toFixed(1)}
                      onChange={(e) =>
                        setLineHeight(
                          Math.max(1, Math.min(parseFloat(e.target.value), 3))
                        )
                      }
                    />
                    <Button
                      variant="bordered"
                      onClick={() => handleLineHeightChange(true)}
                      className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                    >
                      +
                    </Button>
                  </div>
                  <span>Subtitle Mode:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={subtitleMode ? "solid" : "bordered"}
                      onClick={() => handleModeChange("text")}
                      className={`text-white ${
                        !subtitleMode
                          ? "bg-gray-700 hover:bg-gray-800"
                          : "bg-gray-900 hover:bg-gray-800"
                      } transition duration-100`}
                    >
                      Text Mode
                    </Button>
                    <Button
                      variant={subtitleMode ? "bordered" : "solid"}
                      onClick={() => handleModeChange("subtitle")}
                      className={`text-white ${
                        subtitleMode
                          ? "bg-gray-700 hover:bg-gray-800"
                          : "bg-gray-900 hover:bg-gray-800"
                      } transition duration-100`}
                    >
                      Subtitle Mode
                    </Button>
                  </div>

                  {/* New section for Zoom API token input */}
                  <span>Zoom API Token:</span>
                  <Input
                    type="text"
                    value={zoomApiToken}
                    onChange={(e) => setZoomApiToken(e.target.value)}
                    placeholder="Enter Zoom API Token"
                    variant="bordered"
                  />
                  <Button
                    variant="solid"
                    color="primary"
                    className="text-white bg-gray-900 hover:bg-gray-800 transition duration-100"
                    onClick={handleSaveZoomToken}
                  >
                    Save Zoom Token
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
