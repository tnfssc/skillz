import React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ style, variant = "default", ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      borderRadius: "var(--radius-full)",
      padding: "0.125rem 0.625rem",
      fontSize: "0.75rem",
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: "nowrap",
      ...style,
    };

    const variants = {
      default: {
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
      },
      secondary: {
        backgroundColor: "var(--surface-light)",
        color: "var(--text-primary)",
      },
      outline: {
        border: "1px solid var(--border)",
        color: "var(--text-secondary)",
      },
      success: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        color: "var(--success)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
      },
      warning: {
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        color: "var(--warning)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
      },
    };

    return (
      <span ref={ref} style={{ ...baseStyle, ...variants[variant] }} {...props} />
    );
  }
);

Badge.displayName = "Badge";
