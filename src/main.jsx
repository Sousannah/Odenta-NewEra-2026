import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { AuthProvider } from "@/auth/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);

/**
 * Retire the first-paint splash in `index.html`.
 *
 * It hands over to whichever loader the first route mounts — the same wordmark
 * either way, so the crossfade is the boot screen becoming the app's own
 * loader rather than a visible swap.
 */
const boot = document.getElementById("od-boot");
if (boot) {
  requestAnimationFrame(() => {
    boot.classList.add("od-boot-out");
    boot.addEventListener("transitionend", () => boot.remove(), { once: true });
    /* Belt and braces: a tab that never runs the transition still loses it. */
    setTimeout(() => boot.remove(), 600);
  });
}
