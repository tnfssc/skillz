import type { HTMLAttributes } from "../types";

export function Input({
  class: className,
  ...props
}: HTMLAttributes & { type?: string; name?: string; value?: string; placeholder?: string }) {
  return (
    <input
      class={`bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all w-full ${className || ""}`}
      {...props}
    />
  );
}
