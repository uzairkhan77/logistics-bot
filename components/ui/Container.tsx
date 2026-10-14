import { type ReactNode } from "react";

/** `wide` is for the dashboard, which needs the room a marketing page does not. */
export function Container({
  children,
  className = "",
  size = "site",
}: {
  children: ReactNode;
  className?: string;
  size?: "site" | "wide";
}) {
  const width = size === "wide" ? "max-w-[1560px]" : "max-w-[1240px]";
  return <div className={`mx-auto w-full ${width} px-5 sm:px-8 ${className}`}>{children}</div>;
}
