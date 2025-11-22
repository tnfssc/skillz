import { PropsWithChildren } from "hono/jsx";

type BadgeProps = PropsWithChildren<{
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
  class?: string;
}>;

export function Badge({ variant = "default", class: className, children }: BadgeProps) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    outline: "bg-transparent border-slate-700 text-slate-400",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <span
      class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className || ""}`}
    >
      {children}
    </span>
  );
}
