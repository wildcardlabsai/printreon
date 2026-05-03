import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/me/subscriptions/")({
  component: () => null,
  loader: () => {
    if (typeof window !== "undefined") {
      window.location.replace("/me/subscriptions");
    }
    return null;
  },
});
