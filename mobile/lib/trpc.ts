import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// Type-only stub for the AppRouter - matches the server's router shape
// This allows the client to be typed without importing server code
export type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
}
