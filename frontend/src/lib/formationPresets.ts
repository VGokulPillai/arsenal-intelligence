export type FormationId = "4231" | "433" | "352" | "541";

export const FORMATION_META: Record<
  FormationId,
  { label: string; bias: "attacking" | "defensive" | "neutral"; short: string }
> = {
  "4231": { label: "4-2-3-1", bias: "neutral", short: "Balanced block + #10" },
  "433": { label: "4-3-3", bias: "attacking", short: "Width + front three" },
  "352": { label: "3-5-2", bias: "neutral", short: "Wing-backs + twin strikers" },
  "541": { label: "5-4-1", bias: "defensive", short: "Low block + lone outlet" },
};

export const FORMATION_SLOTS: Record<FormationId, { top: number; left: number }[]> = {
  "4231": [
    { top: 86, left: 50 },
    { top: 72, left: 22 },
    { top: 74, left: 38 },
    { top: 74, left: 62 },
    { top: 72, left: 78 },
    { top: 58, left: 36 },
    { top: 58, left: 64 },
    { top: 48, left: 22 },
    { top: 46, left: 50 },
    { top: 48, left: 78 },
    { top: 36, left: 50 },
  ],
  "433": [
    { top: 86, left: 50 },
    { top: 78, left: 28 },
    { top: 78, left: 72 },
    { top: 62, left: 36 },
    { top: 62, left: 50 },
    { top: 62, left: 64 },
    { top: 48, left: 22 },
    { top: 46, left: 38 },
    { top: 46, left: 62 },
    { top: 48, left: 78 },
    { top: 32, left: 50 },
  ],
  "352": [
    { top: 84, left: 42 },
    { top: 84, left: 58 },
    { top: 68, left: 18 },
    { top: 64, left: 36 },
    { top: 64, left: 50 },
    { top: 64, left: 64 },
    { top: 68, left: 82 },
    { top: 48, left: 30 },
    { top: 46, left: 50 },
    { top: 48, left: 70 },
    { top: 30, left: 50 },
  ],
  "541": [
    { top: 88, left: 50 },
    { top: 70, left: 18 },
    { top: 68, left: 34 },
    { top: 66, left: 50 },
    { top: 68, left: 66 },
    { top: 70, left: 82 },
    { top: 52, left: 28 },
    { top: 50, left: 44 },
    { top: 50, left: 56 },
    { top: 52, left: 72 },
    { top: 30, left: 50 },
  ],
};

export function awaySlotsFromHome(home: { top: number; left: number }[]) {
  return home.map((s) => ({ top: 100 - s.top, left: s.left }));
}

export interface FormationPreset {
  id: string;
  name: string;
  formation: string;
  positions: Array<{ x: number; y: number; role: string }>;
}

export const FORMATION_PRESETS: FormationPreset[] = [
  {
    id: "4-3-3",
    name: "4-3-3",
    formation: "4-3-3",
    positions: [
      { x: 50, y: 92, role: "GK" },
      { x: 20, y: 75, role: "LB" },
      { x: 38, y: 78, role: "CB" },
      { x: 62, y: 78, role: "CB" },
      { x: 80, y: 75, role: "RB" },
      { x: 30, y: 55, role: "CM" },
      { x: 50, y: 50, role: "CM" },
      { x: 70, y: 55, role: "CM" },
      { x: 18, y: 28, role: "LW" },
      { x: 50, y: 22, role: "ST" },
      { x: 82, y: 28, role: "RW" },
    ],
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    formation: "4-2-3-1",
    positions: [
      { x: 50, y: 92, role: "GK" },
      { x: 20, y: 75, role: "LB" },
      { x: 38, y: 78, role: "CB" },
      { x: 62, y: 78, role: "CB" },
      { x: 80, y: 75, role: "RB" },
      { x: 38, y: 58, role: "CDM" },
      { x: 62, y: 58, role: "CDM" },
      { x: 20, y: 38, role: "LW" },
      { x: 50, y: 35, role: "CAM" },
      { x: 80, y: 38, role: "RW" },
      { x: 50, y: 18, role: "ST" },
    ],
  },
  {
    id: "3-4-3",
    name: "3-4-3",
    formation: "3-4-3",
    positions: [
      { x: 50, y: 92, role: "GK" },
      { x: 30, y: 78, role: "CB" },
      { x: 50, y: 80, role: "CB" },
      { x: 70, y: 78, role: "CB" },
      { x: 15, y: 55, role: "LWB" },
      { x: 38, y: 58, role: "CM" },
      { x: 62, y: 58, role: "CM" },
      { x: 85, y: 55, role: "RWB" },
      { x: 20, y: 28, role: "LW" },
      { x: 50, y: 22, role: "ST" },
      { x: 80, y: 28, role: "RW" },
    ],
  },
];
