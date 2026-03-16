import { forwardRef, InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`px-4 py-2 rounded-lg outline-none text-sm w-full ${className}`}
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-text)",
          border: "1px solid var(--color-muted)",
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;
