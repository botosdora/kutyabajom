import { Droplets, Footprints, HeartPulse, Smile, Utensils, type LucideIcon } from "lucide-react";
import type { ScaleKey } from "@/lib/journal";

export const SCALE_ICONS: Record<ScaleKey, LucideIcon> = {
  mood: Smile,
  appetite: Utensils,
  activity: Footprints,
  pain: HeartPulse,
  water: Droplets,
};
