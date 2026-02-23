// web/src/data/onboardingOptions.ts
export type Athlete = {
  id: string;
  name: string;
  country?: string;
};

export type Interest = {
  id: string;
  label: string;
};

export const ATHLETES: Athlete[] = [
  { id: "phelps", name: "Michael Phelps", country: "USA" },
  { id: "ledecky", name: "Katie Ledecky", country: "USA" },
  { id: "dressel", name: "Caeleb Dressel", country: "USA" },
  { id: "sjostrom", name: "Sarah Sjöström", country: "SWE" },
  { id: "marchand", name: "Léon Marchand", country: "FRA" },
  { id: "mckeown", name: "Kaylee McKeown", country: "AUS" },
];

export const INTERESTS: Interest[] = [
  { id: "free", label: "Freestyle" },
  { id: "back", label: "Backstroke" },
  { id: "breast", label: "Breaststroke" },
  { id: "fly", label: "Butterfly" },
  { id: "im", label: "Individual Medley" },
  { id: "sprint", label: "Sprint (50/100)" },
  { id: "distance", label: "Distance (800/1500)" },
  { id: "relays", label: "Relays" },
];