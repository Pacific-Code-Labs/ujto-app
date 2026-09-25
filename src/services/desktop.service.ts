import { getDesktop, type DesktopPlatform } from "@/repositories/content.repository";

/**
 * The Ujtö̀ desktop app (fe/desktop, Python + pywebview) shows this web app in a native window
 * and exposes a bridge at window.pywebview.api that downloads media on the user's machine.
 */
export interface DesktopBridge {
  probe(url: string): Promise<{ ok: boolean; title?: string; duration?: number; error?: string }>;
  download_and_upload(
    jobId: string,
    url: string,
    upload: { url: string; fields: Record<string, string> },
  ): Promise<{ ok: boolean; error?: string }>;
  cancel(jobId: string): Promise<void>;
  version(): Promise<string>;
}

declare global {
  interface Window {
    pywebview?: { api: DesktopBridge };
    ujtoDesktop?: { onProgress?: (jobId: string, phase: string, fraction: number) => void };
  }
}

export const desktopBridge = (): DesktopBridge | null =>
  typeof window !== "undefined" && window.pywebview?.api ? window.pywebview.api : null;

export const isDesktopApp = () =>
  desktopBridge() !== null || new URLSearchParams(window.location.search).get("client") === "desktop";

/** pywebview injects its API after load; wait for it (resolves null in a normal browser). */
export function waitForBridge(timeoutMs = 3000): Promise<DesktopBridge | null> {
  const ready = desktopBridge();
  if (ready || new URLSearchParams(window.location.search).get("client") !== "desktop") return Promise.resolve(ready);
  return new Promise((resolve) => {
    const done = () => resolve(desktopBridge());
    window.addEventListener("pywebviewready", done, { once: true });
    window.setTimeout(done, timeoutMs);
  });
}

export type DesktopOs = "mac" | "windows" | "linux";

export function detectOs(): DesktopOs | null {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (nav.userAgentData?.platform || navigator.userAgent).toLowerCase();
  if (platform.includes("mac")) return "mac";
  if (platform.includes("win")) return "windows";
  if (platform.includes("linux") || platform.includes("x11")) return "linux";
  return null;
}

export const downloadUrl = (p: DesktopPlatform) => getDesktop().releaseBaseUrl + p.file;

/** Platforms with the visitor's OS first. */
export function orderedPlatforms(): DesktopPlatform[] {
  const os = detectOs();
  const all = getDesktop().platforms;
  return [...all.filter((p) => p.os === os), ...all.filter((p) => p.os !== os)];
}
