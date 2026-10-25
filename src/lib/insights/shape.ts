export type Tip = { title: string; lacking: string; steps: string[]; tone: "warn" | "bad"; gain?: number };
/** "great" = nothing to improve; "nodata" = we can't judge yet (and say why). */
export type Insight = { state: "great" | "improve" | "nodata"; note: string; items: Tip[] };

export const great = (note: string): Insight => ({ state: "great", note, items: [] });
export const nodata = (note: string): Insight => ({ state: "nodata", note, items: [] });
export const improve = (items: Tip[], note = ""): Insight => ({ state: "improve", note, items });
