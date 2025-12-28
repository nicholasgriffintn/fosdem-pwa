import type { ServiceWorkerRegistrationWithSync } from "./types";

export function registerBackgroundSync() {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  const ServiceWorkerRegistrationCtor = (
    window as typeof window & {
      ServiceWorkerRegistration?: typeof window.ServiceWorkerRegistration;
    }
  ).ServiceWorkerRegistration;

  if (
    !ServiceWorkerRegistrationCtor ||
    !("sync" in ServiceWorkerRegistrationCtor.prototype)
  ) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      const registrationWithSync =
        registration as ServiceWorkerRegistrationWithSync;

      registrationWithSync.sync
        .register("bookmark-sync")
        .catch((error: Error) => {
          console.error("Background sync registration failed:", error);
        });
    })
    .catch((error) => {
      console.warn("Service worker not ready for background sync:", error);
    });
}
