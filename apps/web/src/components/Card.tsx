import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ style, children, ...props }, ref) => {
    const cardStyle: React.CSSProperties = {
      backgroundColor: "var(--surface)",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border)",
      padding: "var(--space-6)",
      boxShadow: "var(--shadow-sm)",
      transition: "var(--transition-normal)",
      ...style,
    };

    return (
      <div ref={ref} style={cardStyle} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
