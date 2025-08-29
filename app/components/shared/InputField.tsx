import React from "react";
import type { FC } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface Props {
  id: string;
  label: string;
  type?: string;
  min?: number;
  max?: number;
  activeId?: string;
  register: UseFormRegisterReturn;
  handleFocus: (id: string) => void;
  handleBlur: () => void;
  isValidField?: boolean;
  wrapperStyle?: string;
}

export const InputField: FC<Props> = ({
  id,
  label,
  type = "text",
  min,
  max,
  activeId,
  register,
  handleFocus,
  handleBlur,
  isValidField,
  wrapperStyle = "",
}) => {
  const isActive = activeId === id;
  
  return (
    <div className={`relative ${wrapperStyle}`}>
      <label
        htmlFor={id}
        className={`
          absolute left-2 transition-all duration-200
          ${isActive || isValidField
            ? 'top-1 text-xs text-gray-500'
            : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
          }
        `}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        {...register}
        onFocus={() => handleFocus(id)}
        onBlur={handleBlur}
        className={`
          w-full px-2 pt-5 pb-1 bg-gray-800 rounded-md border
          ${isActive ? 'border-blue-500' : 'border-gray-700'}
          text-white focus:outline-none
        `}
      />
    </div>
  );
};