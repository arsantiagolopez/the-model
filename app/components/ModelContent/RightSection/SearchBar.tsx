import React, {
  useRef,
  useState,
} from "react";
import type {
  ChangeEventHandler,
  Dispatch,
  FC,
  FocusEventHandler,
  SetStateAction,
} from "react";
import { IoCloseSharp, IoSearchOutline } from "react-icons/io5";

interface Props {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  placeholder: string;
}

const SearchBar: FC<Props> = ({ query, setQuery, placeholder }) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const resultsRef = useRef(null);
  const clearRef = useRef(null);

  const handleChange:
    | ChangeEventHandler<HTMLInputElement>
    | undefined = async ({ target }) => setQuery(target.value);

  const handleFocus = () => setIsFocused(true);

  const handleBlur: FocusEventHandler<HTMLInputElement> | undefined = (
    event
  ) => {
    const { relatedTarget: clickedNode } = event;

    // If clicked outside results modal
    if (
      // @ts-ignore
      !resultsRef?.current?.contains(clickedNode) &&
      clickedNode?.id !== "clearButton"
    ) {
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsFocused(false);
  };

  return (
    <div className="z-10 sticky top-0 w-full block flex-row items-center pt-3 mb-1">
      {/* Bar */}
      <div className="relative flex flex-row justify-center items-center w-full">
        <IoSearchOutline
          className={`absolute left-5 text-2xl pointer-events-none ${
            isFocused ? "text-brand" : "text-tertiary"
          }`}
        />
        <input
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`text-lg px-8 pl-14 w-full rounded-full text-white font-[500] placeholder:text-tertiary outline-none h-14 ${
            isFocused
              ? "bg-primary outline-brand outline-2"
              : "bg-secondary outline-none"
          }`}
        />
        {isFocused && query && (
          <button
            id="clearButton"
            ref={clearRef}
            onClick={handleClear}
            className="absolute right-0 flex flex-row items-center justify-center rounded-r-full h-full pl-1 pr-5"
          >
            <IoCloseSharp className="text-brand text-2xl cursor-pointer" />
          </button>
        )}
      </div>
    </div>
  );
};

export { SearchBar };
