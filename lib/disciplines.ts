export type DisciplineId =
  | "animation-3d"
  | "unreal"
  | "motion-design"
  | "vfx"
  | "storyboard"
  | "character-art"
  | "environment-art"
  | "generalist-3d"
  | "editing"
  | "visual-direction";

export interface Discipline {
  id: DisciplineId;
  label: string;
  short: string;
  blurb: string;
  gradient: string;
  accent: string;
}

export const DISCIPLINES: Discipline[] = [
  {
    id: "animation-3d",
    label: "3D Animation",
    short: "Animator",
    blurb: "Character + creature motion for film, series, and games.",
    gradient: "from-cyan-400/80 via-cyan-500/40 to-sky-700/30",
    accent: "#22D3EE",
  },
  {
    id: "unreal",
    label: "Unreal Engine",
    short: "Unreal Artist",
    blurb: "Real-time scenes, virtual production, cinematics.",
    gradient: "from-amber-400/80 via-orange-500/40 to-rose-700/20",
    accent: "#F59E0B",
  },
  {
    id: "motion-design",
    label: "Motion Design",
    short: "Motion Designer",
    blurb: "Brand systems, idents, type in motion, UI motion.",
    gradient: "from-fuchsia-400/70 via-purple-500/40 to-indigo-700/30",
    accent: "#F472B6",
  },
  {
    id: "vfx",
    label: "VFX",
    short: "VFX Artist",
    blurb: "Houdini sims, compositing, look-dev, integration.",
    gradient: "from-emerald-300/70 via-teal-500/30 to-slate-800/20",
    accent: "#10F0A0",
  },
  {
    id: "storyboard",
    label: "Storyboard",
    short: "Storyboarder",
    blurb: "Sequence ideation, shot language, pre-vis.",
    gradient: "from-amber-300/70 via-orange-500/30 to-rose-700/20",
    accent: "#FCD34D",
  },
  {
    id: "character-art",
    label: "Character Art",
    short: "Character Artist",
    blurb: "Sculpting, look-dev, grooming, rigging-ready meshes.",
    gradient: "from-rose-400/70 via-pink-500/40 to-purple-700/20",
    accent: "#F472B6",
  },
  {
    id: "environment-art",
    label: "Environment Art",
    short: "Environment Artist",
    blurb: "World-building, set dressing, modular kits, lighting.",
    gradient: "from-teal-300/70 via-cyan-500/30 to-blue-800/20",
    accent: "#67E8F9",
  },
  {
    id: "generalist-3d",
    label: "3D Generalist",
    short: "Generalist",
    blurb: "End-to-end shot ownership across the 3D pipeline.",
    gradient: "from-violet-400/70 via-indigo-500/40 to-blue-800/20",
    accent: "#A78BFA",
  },
  {
    id: "editing",
    label: "Editing",
    short: "Editor",
    blurb: "Narrative pacing, color, sound design partnership.",
    gradient: "from-yellow-300/60 via-amber-500/30 to-red-800/20",
    accent: "#FBBF24",
  },
  {
    id: "visual-direction",
    label: "Visual Direction",
    short: "Visual Director",
    blurb: "Art direction, mood, lookbooks, pitch films.",
    gradient: "from-cyan-300/70 via-blue-500/30 to-indigo-900/20",
    accent: "#22D3EE",
  },
];

export const SOFTWARE = [
  "Maya",
  "Blender",
  "Houdini",
  "Cinema 4D",
  "Unreal Engine",
  "Unity",
  "ZBrush",
  "Substance Painter",
  "Substance Designer",
  "Nuke",
  "After Effects",
  "DaVinci Resolve",
  "Premiere",
  "Avid",
  "Marvelous Designer",
  "Photoshop",
  "Illustrator",
  "Figma",
  "TouchDesigner",
  "Marmoset Toolbag",
  "RealityCapture",
  "Twinmotion",
  "Octane",
  "Cycles",
  "Mantra",
  "Karma",
  "MotionBuilder",
  "Toon Boom",
  "Procreate",
] as const;

export type Software = (typeof SOFTWARE)[number];

export function getDiscipline(id: DisciplineId): Discipline {
  return DISCIPLINES.find((d) => d.id === id) ?? DISCIPLINES[0];
}
