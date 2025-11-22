import type { PropsWithChildren } from "hono/jsx";
import type { HTMLAttributes } from "../types";

export function Card({ children, class: className, ...props }: PropsWithChildren<HTMLAttributes>) {
  return (
    <div
      class={`bg-slate-800/50 border border-slate-700 rounded-lg p-6 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
