import React, { useState, useRef, useLayoutEffect } from "react";
import type { FC, ReactNode } from "react";

interface Props {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const Popover: FC<Props> = ({ 
  children, 
  content, 
  className = "",
  placement = "top" 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (isVisible && triggerRef.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;
      
      switch (placement) {
        case "top":
          top = triggerRect.top - popoverRect.height - 8;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          break;
        case "bottom":
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          break;
        case "left":
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.left - popoverRect.width - 8;
          break;
        case "right":
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }
      
      setPosition({ top, left });
    }
  };

  // Use useLayoutEffect for DOM measurements before painting
  useLayoutEffect(() => {
    calculatePosition();
  }, [isVisible, placement]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={popoverRef}
          className={`fixed z-50 bg-gray-800 text-white p-2 rounded shadow-lg ${className}`}
          style={{ top: position.top, left: position.left }}
        >
          {content}
        </div>
      )}
    </>
  );
};

export { Popover };