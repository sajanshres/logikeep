import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// The Convex URL is automatically injected by Convex's CLI during development
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://mock-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
