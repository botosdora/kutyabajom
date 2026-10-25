// Rövid rezgés pipáláskor. Androidon a Vibration API rezget; iPhone-on ez nem
// létezik, de az iOS 18+ a "switch" típusú jelölőnégyzet átkattintásakor ad
// apró rezgést, ezt használjuk ki egy láthatatlan kapcsolóval.
let iosSwitch: HTMLLabelElement | null = null;

export function haptic(pattern: number | number[] = 12) {
  if (typeof window === "undefined") return;
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
    return;
  }
  try {
    if (!iosSwitch) {
      iosSwitch = document.createElement("label");
      iosSwitch.setAttribute("aria-hidden", "true");
      iosSwitch.style.cssText = "position:fixed;left:-9999px;opacity:0;pointer-events:none";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      input.tabIndex = -1;
      iosSwitch.appendChild(input);
      document.body.appendChild(iosSwitch);
    }
    iosSwitch.click();
  } catch {
    // Ha nem támogatott, egyszerűen nincs rezgés.
  }
}
