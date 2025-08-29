import React from "react";
import type { FC } from "react";

interface Props {
  src?: string;
  alt?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Image: FC<Props> = ({ 
  src, 
  alt = "", 
  className = "", 
  width,
  height,
  style,
  onClick
}) => {
  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={style}
      onClick={onClick}
    />
  );
};

export { Image };