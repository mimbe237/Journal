import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Safe navigation hook that falls back to window.location.href if router.push fails.
 * Useful for handling RSC fetch failures during development or network issues.
 */
export function useSafeNavigation() {
  const router = useRouter();

  const navigate = useCallback(
    (href: Route) => {
      try {
        router.push(href);
      } catch (error) {
        console.warn("[useSafeNavigation] Router.push failed, falling back to window.location:", error);
        window.location.href = href;
      }
    },
    [router]
  );

  return navigate;
}
