import React, {
  useState,
} from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FC,
  MouseEventHandler,
  SetStateAction,
} from "react";
import { FaMinus } from "react-icons/fa";
import { GoPlus } from "react-icons/go";
import { Dropdown } from "../../../../shared/Dropdown";
import { InputField } from "../../../../shared/InputField";

interface Props {
  setReasoning: Dispatch<SetStateAction<string | undefined>>;
  activeField?: string;
  handleFocus: (id: string) => void;
  handleBlur: () => void;
}

const Reasoning: FC<Props> = ({
  setReasoning,
  activeField,
  handleFocus,
  handleBlur,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> | undefined = ({
    target,
  }) => {
    setValue(target.value);
    setReasoning(target.value);
  };

  const toggleOpen: MouseEventHandler<HTMLDivElement> | undefined = () =>
    setIsOpen(!isOpen);

  return (
    <>
      <Dropdown
        Button={
          <div
            onClick={toggleOpen}
            className="flex flex-row items-center py-3 text-brand hover:text-brandHover"
          >
            {isOpen ? (
              <FaMinus className="text-[0.6rem] mr-1" />
            ) : (
              <GoPlus className="text-[0.6rem] mr-1" />
            )}

            <p className="text-xs font-[800]">Reasoning</p>
          </div>
        }
        Content={
          <InputField
            id="reasoning"
            label="Reasoning"
            activeId={activeField}
            handleFocus={handleFocus}
            handleBlur={handleBlur}
            wrapperStyle="mb-3"
            CustomInput={
              <textarea
                id="reasoning"
                value={value}
                onChange={handleChange}
                className="text-white text-lg w-full bg-transparent outline-none min-h-[5rem] leading-5 pt-4 max-h-[10rem]"
                onFocus={() => handleFocus("reasoning")}
                onBlur={handleBlur}
                autoFocus
              />
            }
          />
        }
      />
    </>
  );
};

export { Reasoning };
