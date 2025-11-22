import { PropsWithChildren } from "hono/jsx";

type ButtonProps = PropsWithChildren<{
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  class?: string;
  [key: string]: unknown;
}>;

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  class: className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary: "bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 border border-transparent",
    secondary: "bg-secondary hover:bg-secondary-600 text-white shadow-lg shadow-secondary/25 border border-transparent",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white",
    outline: "bg-transparent border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 border border-transparent",
  };

  const sizes = {
    sm: "h-8 px-4 text-xs",
    md: "h-10 px-6 text-sm",
    lg: "h-12 px-8 text-base",
  };

  return (
    <button type={type} class={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`} {...props}>
      {children}
    </button>
  );
}
