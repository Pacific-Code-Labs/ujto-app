import { useEffect, useState } from "react";
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
  /** Missing in the first desktop builds (they always download). */
  capabilities?(): Promise<{ edition: "full" | "store"; download: boolean }>;
}

declare global {
  interface Window {
    pywebview?: { api: DesktopBridge };
    ujtoDesktop?: { onProgress?: (jobId: string, phase: string, fraction: number) => void };
  }
}

export const desktopBridge = (): DesktopBridge | null =>
  typeof window !== "undefined" && window.pywebview?.api ? window.pywebview.api : null;

export const isDesktopApp = () => desktopBridge() !== null;

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

/** The bridge, once pywebview has injected it (null in a normal browser). */
export function useDesktopBridge(): DesktopBridge | null {
  const [bridge, setBridge] = useState(desktopBridge);
  useEffect(() => {
    if (bridge) return;
    const ready = () => setBridge(desktopBridge());
    window.addEventListener("pywebviewready", ready);
    return () => window.removeEventListener("pywebviewready", ready);
  }, [bridge]);
  return bridge;
}

/**
 * Whether this desktop build can download links on the user's machine. The Microsoft Store
 * edition can't (Store policy), so the Link tab falls back to the server there.
 */
export function useDesktopDownloads(): boolean {
  const bridge = useDesktopBridge();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!bridge) return setEnabled(false);
    let alive = true;
    if (!bridge.capabilities) setEnabled(true);
    else
      bridge
        .capabilities()
        .then((c) => alive && setEnabled(!!c?.download))
        .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, [bridge]);
  return enabled;
}

/** Subscribe to the bridge's progress events for one job (phase + 0–1 fraction). */
export function onDesktopProgress(listener: (jobId: string, phase: string, fraction: number) => void) {
  window.ujtoDesktop = { ...(window.ujtoDesktop ?? {}), onProgress: listener };
  return () => {
    if (window.ujtoDesktop?.onProgress === listener) window.ujtoDesktop.onProgress = undefined;
  };
}

export type DesktopOs = "mac" | "windows" | "linux";
export type DesktopArch = "arm64" | "x64";

type UAData = {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>;
};

/** The visitor's OS, from User-Agent Client Hints when available, else the user agent. */
export function detectOs(): DesktopOs | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as Navigator & { userAgentData?: UAData };
  const platform = (nav.userAgentData?.platform || navigator.userAgent).toLowerCase();
  if (/iphone|ipad|android/.test(navigator.userAgent.toLowerCase())) return null; // no desktop build for phones
  if (platform.includes("mac")) return "mac";
  if (platform.includes("win")) return "windows";
  if (platform.includes("linux") || platform.includes("x11")) return "linux";
  return null;
}

/**
 * CPU architecture. Chromium browsers expose it through high-entropy client hints; Safari and
 * Firefox report every Mac as "Intel", so Macs default to Apple silicon (every Mac since 2020)
 * and the Intel build stays listed right below.
 */
export async function detectArch(os: DesktopOs | null): Promise<DesktopArch> {
  const nav = (typeof navigator !== "undefined" ? navigator : undefined) as (Navigator & { userAgentData?: UAData }) | undefined;
  try {
    const hints = await nav?.userAgentData?.getHighEntropyValues?.(["architecture", "bitness"]);
    if (hints?.architecture === "arm") return "arm64";
    if (hints?.architecture === "x86") return "x64";
  } catch {
    /* hints unavailable */
  }
  return os === "mac" ? "arm64" : "x64";
}

/** The visitor's OS + architecture (architecture resolves asynchronously in Chromium). */
export function useVisitorPlatform(): { os: DesktopOs | null; arch: DesktopArch | null } {
  const [os] = useState(detectOs);
  const [arch, setArch] = useState<DesktopArch | null>(null);
  useEffect(() => {
    let alive = true;
    void detectArch(os).then((a) => alive && setArch(a));
    return () => {
      alive = false;
    };
  }, [os]);
  return { os, arch };
}

/** Best installer for this visitor: same OS, and the same architecture when it is known. */
export function pickPlatform<P extends { os: string; arch: string }>(platforms: P[], os: DesktopOs | null, arch: DesktopArch | null): P | null {
  const sameOs = platforms.filter((p) => p.os === os);
  return sameOs.find((p) => p.arch === (arch ?? (os === "mac" ? "arm64" : "x64"))) ?? sameOs[0] ?? null;
}

export const downloadUrl = (p: DesktopPlatform) => getDesktop().releaseBaseUrl + p.file;

/** Platforms with the best match for this visitor first, then the same OS, then the rest. */
export function usePlatformsInOrder(): { platforms: DesktopPlatform[]; primary: DesktopPlatform | null } {
  const { os, arch } = useVisitorPlatform();
  const all = getDesktop().platforms;
  const primary = pickPlatform(all, os, arch);
  const rest = all.filter((p) => p !== primary);
  return {
    primary,
    platforms: [...(primary ? [primary] : []), ...rest.filter((p) => p.os === os), ...rest.filter((p) => p.os !== os)],
  };
}
