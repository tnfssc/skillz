import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ style, ...props }, ref) => {
    const inputStyle: React.CSSProperties = {
      width: "100%",
      padding: "0.5rem 0.75rem",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border)",
      backgroundColor: "var(--background)",
      color: "var(--text-primary)",
      fontSize: "0.875rem",
      outline: "none",
      transition: "var(--transition-fast)",
      height: "2.5rem",
      ...style,
    };

    return (
      <input
        ref={ref}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--primary)";
          e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary-200)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
