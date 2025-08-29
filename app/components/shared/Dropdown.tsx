import React, { useState } from "react";
import type { FC, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface Props {
  Button: ReactNode;
  Content: ReactNode;
  hasRightArrow?: boolean;
  isDefaultOpen?: boolean;
}

export const Dropdown: FC<Props> = ({
  Button,
  Content,
  hasRightArrow = false,
  isDefaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  return (
    <div className="w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-800 rounded"
      >
        {Button}
        {hasRightArrow && (
          <ChevronRight
            className={`transition-transform ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        )}
      </div>
      {isOpen && (
        <div className="mt-2">
          {Content}
        </div>
      )}
    </div>
  );
};