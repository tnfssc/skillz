import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", style, ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-md)",
      fontWeight: 500,
      cursor: "pointer",
      transition: "var(--transition-fast)",
      border: "1px solid transparent",
      outline: "none",
      fontFamily: "inherit",
    };

    const variants = {
      primary: {
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        boxShadow: "var(--shadow-md)",
      },
      secondary: {
        backgroundColor: "var(--surface-light)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "var(--text-secondary)",
      },
      outline: {
        backgroundColor: "transparent",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
      },
    };

    const sizes = {
      sm: {
        padding: "0.25rem 0.75rem",
        fontSize: "0.875rem",
        height: "2rem",
      },
      md: {
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
        height: "2.5rem",
      },
      lg: {
        padding: "0.75rem 1.5rem",
        fontSize: "1rem",
        height: "3rem",
      },
    };

    const combinedStyle = {
      ...baseStyles,
      ...variants[variant],
      ...sizes[size],
      ...style,
    };

    return (
      <button
        ref={ref}
        style={combinedStyle}
        onMouseEnter={(e) => {
          if (variant === "primary") e.currentTarget.style.backgroundColor = "var(--primary-hover)";
          if (variant === "secondary") e.currentTarget.style.backgroundColor = "var(--surface-hover)";
          if (variant === "ghost") {
            e.currentTarget.style.backgroundColor = "var(--surface-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }
          if (variant === "outline") e.currentTarget.style.borderColor = "var(--text-secondary)";
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, variants[variant]);
        }}
        className={className}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
