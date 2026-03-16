import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    const base = "px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-60 transition-opacity";
    const styles =
      variant === "primary"
        ? { backgroundColor: "var(--color-yellow)", color: "black" }
        : { backgroundColor: "transparent", color: "var(--color-text)" };

    return (
      <button ref={ref} className={`${base} ${className}`} style={styles} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
