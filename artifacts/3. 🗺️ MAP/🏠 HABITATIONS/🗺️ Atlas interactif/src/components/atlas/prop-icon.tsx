import {
  AlignLeft,
  BookOpen,
  CircleDot,
  Clock,
  DoorOpen,
  Eye,
  Flag,
  Flame,
  Hash,
  Heart,
  Home,
  Key,
  Lock,
  MapPin,
  Palette,
  Shield,
  Star,
  Sun,
  Tags,
  Thermometer,
  ToggleLeft,
  Type,
  Users,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { PropIconId } from "@/lib/map/types";
import { defaultIcon } from "@/lib/map/props";
import { cn } from "@/lib/utils";

export const PROP_ICON_MAP: Record<PropIconId, LucideIcon> = {
  tags: Tags,
  type: Type,
  "align-left": AlignLeft,
  hash: Hash,
  toggle: ToggleLeft,
  choice: CircleDot,
  palette: Palette,
  users: Users,
  lock: Lock,
  sun: Sun,
  flame: Flame,
  shield: Shield,
  key: Key,
  star: Star,
  "map-pin": MapPin,
  heart: Heart,
  eye: Eye,
  clock: Clock,
  flag: Flag,
  home: Home,
  book: BookOpen,
  thermometer: Thermometer,
  volume: Volume2,
  door: DoorOpen,
};

export function PropIcon({
  id,
  type,
  className,
}: {
  id?: PropIconId;
  type?: Parameters<typeof defaultIcon>[0];
  className?: string;
}) {
  const key = id ?? (type ? defaultIcon(type) : "tags");
  const Icon = PROP_ICON_MAP[key] ?? Tags;
  return <Icon className={cn("size-4", className)} />;
}
