import type { PropValue, RoomStep } from "./types";
import type {
  AssistFill,
  AssistIntensity,
  AssistLength,
  AssistOverwrite,
  AssistVoice,
} from "./ui";

export type PropHint = {
  id: string;
  name: string;
  type: string;
  options?: Array<{ id: string; label: string }>;
};

export type ImproviseAiInput = {
  name: string;
  kind: "room" | "zone";
  workspace?: string;
  floor?: string;
  existing?: string;
  prompt: string;
  voice: AssistVoice;
  length: AssistLength;
  intensity: AssistIntensity;
  fill: AssistFill;
  overwrite: AssistOverwrite;
  props: PropHint[];
  current: Record<string, PropValue>;
  steps?: RoomStep[];
};
