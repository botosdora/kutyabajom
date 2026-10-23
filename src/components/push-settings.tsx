"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Share } from "lucide-react";
import { removePushSubscription, requestTestNotification, savePushSubscription } from "@/app/(app)/actions";
import { useToast } from "@/components/toast";
import { Alert, buttonClass } from "@/components/ui";
import { VAPID_PUBLIC_KEY } from "@/lib/push";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function base64ToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function isIosBrowser() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

// Értesítések be- és kikapcsolása ezen az eszközön.
export function PushSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      if (isIosBrowser()) return setStatus("ios-install");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setStatus("unsupported");
      if (Notification.permission === "denied") return setStatus("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    })().catch(() => setStatus("unsupported"));
  }, []);

  const [error, setError] = useState<string | null>(null);

  const enable = async () => {
    setBusy(true);
    setError(null);
    let step = "engedélykérés";
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        if (permission !== "denied") setError("Nem adtál engedélyt az értesítésekre.");
        return;
      }
      step = "service worker";
      const reg = await navigator.serviceWorker.ready;
      step = "feliratkozás";
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(VAPID_PUBLIC_KEY) }));
      step = "mentés";
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const result = await savePushSubscription({ ...json, userAgent: navigator.userAgent });
      if (!result.ok) throw new Error("az adatbázis nem fogadta el");
      setStatus("on");
      toast("Értesítések bekapcsolva ezen az eszközön.");
    } catch (e) {
      setError(`Nem sikerült bekapcsolni (lépés: ${step}). ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("off");
    setBusy(false);
  };

  const test = async () => {
    setBusy(true);
    const result = await requestTestNotification();
    toast(result.ok ? "Egy percen belül megérkezik a próbaértesítés." : "Nem sikerült.");
    setBusy(false);
  };

  if (status === "loading") return <p className="text-sm text-text-muted">Betöltés…</p>;
  if (status === "unsupported")
    return <Alert>Ez a böngésző nem támogatja a push értesítéseket. Próbáld Chrome-ban, Edge-ben vagy Safariban.</Alert>;
  if (status === "ios-install")
    return (
      <Alert>
        iPhone-on az értesítésekhez előbb add hozzá az appot a kezdőképernyőhöz: Safariban a{" "}
        <Share size={14} className="inline" aria-label="Megosztás" /> gomb, majd „Főképernyőhöz adás”. Utána onnan
        nyisd meg, és itt kapcsold be.
      </Alert>
    );
  if (status === "denied")
    return (
      <Alert kind="error">
        Az értesítések le vannak tiltva ennél az oldalnál. A böngésző (vagy a telefon) beállításaiban engedélyezd, majd
        töltsd újra az oldalt.
      </Alert>
    );

  return status === "on" ? (
    <div className="flex flex-col gap-3">
      <Alert kind="success">Ezen az eszközön be vannak kapcsolva az értesítések.</Alert>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={test} className={buttonClass("secondary")}>
          <Bell size={18} aria-hidden="true" /> Próbaértesítés
        </button>
        <button type="button" disabled={busy} onClick={disable} className={buttonClass("ghost")}>
          <BellOff size={18} aria-hidden="true" /> Kikapcsolás
        </button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <button type="button" disabled={busy} onClick={enable} className={buttonClass("primary", "w-full")}>
        <Bell size={18} aria-hidden="true" /> {busy ? "Bekapcsolás…" : "Értesítések bekapcsolása ezen az eszközön"}
      </button>
      {error && <Alert kind="error">{error}</Alert>}
    </div>
  );
}
