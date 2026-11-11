import { useRef, type InputHTMLAttributes } from "react";

type ClearableInputProps = InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onClear: () => void;
};

/** A text input with an iOS-style ⓧ button that empties it. */
export function ClearableInput({ onClear, ...inputProps }: ClearableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showClear = inputProps.value !== "" && !inputProps.disabled;

  return (
    <span className="clearable-input">
      <input ref={inputRef} {...inputProps} />
      {showClear && (
        <button
          type="button"
          className="clearable-input__clear"
          aria-label="Clear"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 5l6 6M11 5l-6 6" />
          </svg>
        </button>
      )}
    </span>
  );
}
