import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from "@nextui-org/react";
import { Icons } from "./icons";

interface TextAreaDisplayProps {
  textSize: number;
  lineHeight: number;
}

const TextAreaDisplay: React.FC<TextAreaDisplayProps> = ({
  textSize,
  lineHeight,
}) => {
  const [popoverVisible, setPopoverVisible] = useState(false);

  const copyText = () => {
    const textarea = document.getElementById("results") as HTMLTextAreaElement;
    if (textarea) {
      textarea.select();
      document.execCommand("copy");
      setPopoverVisible(true);
      document.getSelection()?.removeAllRanges();
    }
  };

  return (
    <div className="relative w-full h-full mb-4">
      <textarea
        id="results"
        rows={5}
        readOnly
        className="w-full p-2 border rounded bg-gray-700 text-white font-mono h-full custom-scrollbar"
        style={{
          resize: "vertical",
          fontSize: `${textSize}rem`,
          lineHeight: lineHeight,
          height: "400px", // fixed height
        }}
      ></textarea>

      <Popover
        placement="top"
        isOpen={popoverVisible}
        onOpenChange={(isOpen) => setPopoverVisible(isOpen)}
      >
        <PopoverTrigger>
          <Button
            variant="bordered"
            className="absolute bottom-6 right-5 text-white bg-gray-700 hover:bg-gray-800 transition duration-100"
            onClick={copyText}
            onMouseLeave={() => setPopoverVisible(false)}
          >
            <Icons.copy size={25} color="white" />
            Copy text
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="px-1 py-2">
            <div className="text-small font-bold">Text copied!</div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TextAreaDisplay;
