import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Checkbox,
  Input,
} from "@nextui-org/react";
import { Icons } from "../icons";
import { useSettings } from "../SettingsContext"; // Adjust the path as necessary

export default function Settings() {
  const { textSize, setTextSize, lineHeight, setLineHeight, showSoundClips, setShowSoundClips } = useSettings();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [backdrop, setBackdrop] = React.useState("opaque");

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
              <ModalHeader className="flex flex-col gap-1 text-white">Settings</ModalHeader>
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
                      onChange={(e) => setTextSize(Math.max(1, Math.min(parseFloat(e.target.value), 8)))}
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
                      onChange={(e) => setLineHeight(Math.max(1, Math.min(parseFloat(e.target.value), 3)))}
                    />
                    <Button
                      variant="bordered"
                      onClick={() => handleLineHeightChange(true)}
                      className="text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <Checkbox
                      isSelected={showSoundClips}
                      onChange={(e) => setShowSoundClips(e.target.checked)}
                      className="text-gray-300"
                    >
                      <span className="text-white">Show Sound Clips</span>
                    </Checkbox>
                  </div>
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
