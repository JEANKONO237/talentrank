// TalentRank — Professions catalogue
// ----------------------------------------------------------------------------
// Source-of-truth: every talent belongs to EXACTLY ONE profession.
// Rankings are ALWAYS scoped to a single profession (never mixed).
// Synonyms / aliases are recorded here so candidates typing variants
// ("3D Animator", "Animateur 3D", "Animation 3D") map to the same canonical
// profession, and admins can validate community-submitted custom professions.

export type ProfessionCategoryId =
  | "tech"
  | "creative"
  | "business"
  | "finance"
  | "marketing"
  | "product"
  | "data"
  | "engineering"
  | "health"
  | "education"
  | "hospitality"
  | "logistics"
  | "media"
  | "music"
  | "architecture"
  | "legal"
  | "hr"
  | "trades"
  | "other";

export interface ProfessionCategory {
  id: ProfessionCategoryId;
  label: string;
  /** French display label. */
  frLabel: string;
  color: string;
}

export const PROFESSION_CATEGORIES: ProfessionCategory[] = [
  { id: "tech",         label: "Technology & Engineering",     frLabel: "Tech & Ingénierie logicielle",      color: "#22D3EE" },
  { id: "creative",     label: "Creative & Visual",            frLabel: "Création & Visuel",                  color: "#F472B6" },
  { id: "business",     label: "Business & Strategy",          frLabel: "Business & Stratégie",               color: "#A78BFA" },
  { id: "finance",      label: "Finance",                      frLabel: "Finance",                            color: "#10F0A0" },
  { id: "marketing",    label: "Marketing & Growth",           frLabel: "Marketing & Growth",                 color: "#FBBF24" },
  { id: "product",      label: "Product & UX",                 frLabel: "Produit & UX",                       color: "#67E8F9" },
  { id: "data",         label: "Data & AI",                    frLabel: "Data & IA",                          color: "#A78BFA" },
  { id: "engineering",  label: "Hardware & Industrial",        frLabel: "Hardware & Industriel",              color: "#94A3B8" },
  { id: "health",       label: "Health & Care",                frLabel: "Santé & Soins",                      color: "#F472B6" },
  { id: "education",    label: "Education & Research",         frLabel: "Éducation & Recherche",              color: "#FBBF24" },
  { id: "hospitality",  label: "Hospitality & Food",           frLabel: "Hôtellerie & Restauration",          color: "#FCD34D" },
  { id: "logistics",    label: "Logistics & Operations",       frLabel: "Logistique & Opérations",            color: "#94A3B8" },
  { id: "media",        label: "Media & Communication",        frLabel: "Médias & Communication",             color: "#67E8F9" },
  { id: "music",        label: "Music & Audio",                frLabel: "Musique & Audio",                    color: "#F472B6" },
  { id: "architecture", label: "Architecture & Construction",  frLabel: "Architecture & Construction",        color: "#FBBF24" },
  { id: "legal",        label: "Legal",                        frLabel: "Juridique",                          color: "#A78BFA" },
  { id: "hr",           label: "People & HR",                  frLabel: "RH & People",                        color: "#10F0A0" },
  { id: "trades",       label: "Skilled Trades",               frLabel: "Métiers manuels & artisanat",        color: "#F59E0B" },
  { id: "other",        label: "Other",                        frLabel: "Autre",                              color: "#94A3B8" },
];

export interface Profession {
  id: string;
  category: ProfessionCategoryId;
  /** Canonical English display label. */
  label: string;
  /** Canonical French display label (used as default since FR is DEFAULT_LOCALE). */
  frLabel: string;
  /** Short label for chips / cards. */
  short: string;
  /** Short French label. */
  frShort: string;
  gradient: string;
  /** Free-text variants that should match this profession during onboarding /
   *  admin-side dedup. Stored lowercase, no accents, but matching is normalized. */
  synonyms?: string[];
  /** True when the profession was added by a candidate and is awaiting admin validation. */
  pending?: boolean;
  /** True when the profession was submitted by the community (post-validation = false). */
  community?: boolean;
}

// Keep this list growing. Synonyms cover FR + EN variants commonly typed by candidates.
export const PROFESSIONS: Profession[] = [
  // ── Tech & Engineering ─────────────────────────────────────────────────────
  { id: "software-engineer",  category: "tech", label: "Software Engineer",      frLabel: "Développeur Logiciel",      short: "Software",   frShort: "Dév Logiciel",    gradient: "from-cyan-400 via-blue-600 to-indigo-900",   synonyms: ["software developer", "ingénieur logiciel", "développeur", "developer", "programmer", "programmeur"] },
  { id: "frontend-engineer",  category: "tech", label: "Frontend Engineer",      frLabel: "Développeur Frontend",      short: "Frontend",   frShort: "Frontend",        gradient: "from-cyan-300 via-sky-600 to-blue-900",      synonyms: ["frontend developer", "front-end engineer", "développeur front", "dev front", "react developer", "vue developer"] },
  { id: "backend-engineer",   category: "tech", label: "Backend Engineer",       frLabel: "Développeur Backend",       short: "Backend",    frShort: "Backend",         gradient: "from-teal-300 via-cyan-700 to-slate-900",    synonyms: ["backend developer", "back-end engineer", "développeur back", "dev back", "api developer"] },
  { id: "fullstack-engineer", category: "tech", label: "Full-Stack Engineer",    frLabel: "Développeur Full-Stack",    short: "Full-Stack", frShort: "Full-Stack",      gradient: "from-emerald-300 via-teal-600 to-slate-900", synonyms: ["fullstack developer", "full stack", "développeur fullstack"] },
  { id: "mobile-engineer",    category: "tech", label: "Mobile Engineer",        frLabel: "Développeur Mobile",        short: "Mobile",     frShort: "Mobile",          gradient: "from-violet-300 via-indigo-600 to-slate-900", synonyms: ["mobile developer", "ios developer", "android developer", "développeur ios", "développeur android"] },
  { id: "devops-sre",         category: "tech", label: "DevOps / SRE",           frLabel: "Ingénieur DevOps / SRE",    short: "DevOps",     frShort: "DevOps",          gradient: "from-orange-300 via-red-600 to-zinc-900",    synonyms: ["devops engineer", "site reliability engineer", "platform engineer", "ingénieur plateforme"] },
  { id: "security-engineer",  category: "tech", label: "Security Engineer",      frLabel: "Ingénieur Sécurité",         short: "Security",   frShort: "Sécurité",        gradient: "from-rose-300 via-red-700 to-zinc-900",      synonyms: ["cybersecurity engineer", "infosec engineer", "ingénieur cybersécurité", "pentester"] },
  { id: "game-developer",     category: "tech", label: "Game Developer",         frLabel: "Développeur Jeu Vidéo",     short: "Game Dev",   frShort: "Dév Jeu",         gradient: "from-amber-300 via-orange-600 to-rose-900",  synonyms: ["game programmer", "gameplay engineer", "programmeur jeu vidéo"] },
  { id: "embedded-engineer",  category: "tech", label: "Embedded / Firmware",    frLabel: "Ingénieur Embarqué",        short: "Embedded",   frShort: "Embarqué",        gradient: "from-yellow-300 via-amber-600 to-zinc-900",  synonyms: ["firmware engineer", "iot developer", "embedded developer"] },

  // ── Data & AI ───────────────────────────────────────────────────────────────
  { id: "data-scientist",  category: "data", label: "Data Scientist",      frLabel: "Data Scientist",          short: "Data Sci.", frShort: "Data Sci.",     gradient: "from-violet-300 via-purple-600 to-indigo-900", synonyms: ["scientifique des données", "machine learning scientist"] },
  { id: "ml-engineer",     category: "data", label: "ML / AI Engineer",    frLabel: "Ingénieur ML / IA",       short: "ML Eng.",   frShort: "Ingénieur ML", gradient: "from-fuchsia-300 via-violet-600 to-indigo-900", synonyms: ["machine learning engineer", "ai engineer", "ingénieur intelligence artificielle", "mlops"] },
  { id: "data-engineer",   category: "data", label: "Data Engineer",       frLabel: "Data Engineer",           short: "Data Eng.", frShort: "Data Eng.",     gradient: "from-cyan-300 via-blue-700 to-slate-900",      synonyms: ["ingénieur data", "ingénieur des données", "data pipeline engineer"] },
  { id: "data-analyst",    category: "data", label: "Data Analyst",        frLabel: "Analyste Data",           short: "Analyst",   frShort: "Analyste",      gradient: "from-emerald-300 via-teal-700 to-slate-900",    synonyms: ["analyste données", "business intelligence analyst", "bi analyst"] },

  // ── Creative & Visual ──────────────────────────────────────────────────────
  { id: "animation-3d",        category: "creative", label: "3D Animator",            frLabel: "Animateur 3D",          short: "Animator",     frShort: "Animateur",      gradient: "from-cyan-400 via-cyan-600 to-indigo-900",   synonyms: ["3d animation", "animation 3d", "animateur 3d", "character animator", "animateur de personnages", "creature animator"] },
  { id: "2d-animator",         category: "creative", label: "2D Animator",            frLabel: "Animateur 2D",          short: "2D Anim.",     frShort: "Animateur 2D",   gradient: "from-pink-300 via-fuchsia-500 to-purple-900", synonyms: ["2d animation", "animation 2d", "frame by frame", "traditional animator"] },
  { id: "unreal-artist",       category: "creative", label: "Unreal Engine Artist",   frLabel: "Artiste Unreal Engine", short: "Unreal",        frShort: "Unreal",         gradient: "from-amber-300 via-orange-500 to-rose-800",  synonyms: ["unreal engine", "ue5 artist", "real-time artist", "artiste temps réel", "virtual production artist"] },
  { id: "motion-designer",     category: "creative", label: "Motion Designer",        frLabel: "Motion Designer",       short: "Motion",        frShort: "Motion",         gradient: "from-violet-400 via-fuchsia-500 to-indigo-900", synonyms: ["motion design", "motion graphics", "motion grapher", "designer motion", "after effects artist"] },
  { id: "vfx-artist",          category: "creative", label: "VFX Artist",             frLabel: "Artiste VFX",           short: "VFX",           frShort: "VFX",            gradient: "from-emerald-300 via-teal-600 to-slate-900", synonyms: ["vfx", "visual effects artist", "fx artist", "fx td", "compositor", "compositeur"] },
  { id: "storyboard-artist",   category: "creative", label: "Storyboard Artist",      frLabel: "Storyboardeur",         short: "Storyboard",    frShort: "Storyboard",     gradient: "from-yellow-200 via-amber-500 to-zinc-900",  synonyms: ["storyboarder", "storyboardeuse", "pre-vis artist", "storyboard"] },
  { id: "character-artist",    category: "creative", label: "Character Artist",       frLabel: "Character Artist",      short: "Character",     frShort: "Character",      gradient: "from-rose-300 via-pink-500 to-purple-900",    synonyms: ["character art", "creature artist", "character sculptor", "modeleur personnages", "artiste personnages"] },
  { id: "environment-artist",  category: "creative", label: "Environment Artist",     frLabel: "Environment Artist",    short: "Environment",   frShort: "Environment",    gradient: "from-teal-300 via-cyan-500 to-blue-800",      synonyms: ["environment art", "world builder", "level artist", "modeleur décor", "artiste décor"] },
  { id: "3d-generalist",       category: "creative", label: "3D Generalist",          frLabel: "Généraliste 3D",        short: "Generalist",    frShort: "Généraliste",    gradient: "from-violet-400 via-indigo-500 to-blue-800",  synonyms: ["3d generalist", "généraliste 3d", "3d artist", "artiste 3d"] },
  { id: "video-editor",        category: "creative", label: "Video Editor",           frLabel: "Monteur Vidéo",         short: "Editor",        frShort: "Monteur",        gradient: "from-yellow-300 via-amber-500 to-red-800",    synonyms: ["editor", "monteur", "monteuse", "video editing", "montage vidéo", "film editor"] },
  { id: "visual-director",     category: "creative", label: "Visual Director",        frLabel: "Directeur Visuel",      short: "Visual Dir.",   frShort: "Direction Visuelle", gradient: "from-cyan-300 via-blue-500 to-indigo-900", synonyms: ["visual direction", "art director", "directeur artistique", "creative director"] },
  { id: "graphic-designer",    category: "creative", label: "Graphic Designer",       frLabel: "Graphiste",             short: "Graphic",       frShort: "Graphiste",      gradient: "from-pink-300 via-fuchsia-500 to-purple-900", synonyms: ["graphic design", "designer graphique", "graphisme", "infographiste"] },
  { id: "illustrator",         category: "creative", label: "Illustrator",            frLabel: "Illustrateur",          short: "Illustrator",   frShort: "Illustrateur",   gradient: "from-amber-300 via-pink-500 to-violet-900",   synonyms: ["illustration", "illustratrice", "concept artist", "concept art"] },
  { id: "photographer",        category: "creative", label: "Photographer",           frLabel: "Photographe",           short: "Photographer",  frShort: "Photographe",    gradient: "from-sky-300 via-cyan-600 to-slate-900",      synonyms: ["photography", "photographe portrait", "photographe mode"] },

  // ── Product & UX ────────────────────────────────────────────────────────────
  { id: "product-manager",  category: "product", label: "Product Manager",   frLabel: "Product Manager",       short: "PM",          frShort: "PM",            gradient: "from-amber-300 via-orange-500 to-rose-800",  synonyms: ["chef de produit", "product owner", "po", "responsable produit"] },
  { id: "ux-designer",      category: "product", label: "UX Designer",       frLabel: "UX Designer",           short: "UX",          frShort: "UX",            gradient: "from-violet-300 via-fuchsia-500 to-rose-700", synonyms: ["user experience designer", "designer ux", "designer expérience utilisateur"] },
  { id: "ui-designer",      category: "product", label: "UI Designer",       frLabel: "UI Designer",           short: "UI",          frShort: "UI",            gradient: "from-cyan-300 via-sky-500 to-indigo-900",    synonyms: ["user interface designer", "designer ui", "designer interface"] },
  { id: "product-designer", category: "product", label: "Product Designer",  frLabel: "Product Designer",      short: "Product Des.", frShort: "Product Des.", gradient: "from-rose-300 via-pink-500 to-violet-900",    synonyms: ["designer produit", "designer numérique"] },
  { id: "ux-researcher",    category: "product", label: "UX Researcher",     frLabel: "UX Researcher",         short: "Researcher",   frShort: "Chercheur UX", gradient: "from-emerald-300 via-teal-500 to-slate-900",  synonyms: ["chercheur ux", "researcher", "user researcher"] },

  // ── Marketing & Growth ──────────────────────────────────────────────────────
  { id: "growth-marketer",      category: "marketing", label: "Growth Marketer",     frLabel: "Growth Marketer",         short: "Growth",   frShort: "Growth",   gradient: "from-yellow-300 via-amber-500 to-red-800",    synonyms: ["growth hacker", "growth manager", "responsable acquisition"] },
  { id: "content-marketer",     category: "marketing", label: "Content Marketer",    frLabel: "Content Marketer",        short: "Content",  frShort: "Contenu",  gradient: "from-pink-300 via-fuchsia-500 to-purple-900", synonyms: ["content manager", "responsable contenu", "rédacteur web", "content strategist"] },
  { id: "seo-specialist",       category: "marketing", label: "SEO Specialist",      frLabel: "Spécialiste SEO",         short: "SEO",      frShort: "SEO",      gradient: "from-cyan-300 via-sky-500 to-blue-900",       synonyms: ["seo manager", "search engine optimization", "référenceur"] },
  { id: "social-media-manager", category: "marketing", label: "Social Media Manager", frLabel: "Social Media Manager",    short: "Social",   frShort: "Social",   gradient: "from-violet-300 via-fuchsia-500 to-indigo-900", synonyms: ["community manager", "responsable réseaux sociaux", "social manager"] },
  { id: "brand-strategist",     category: "marketing", label: "Brand Strategist",    frLabel: "Stratège de Marque",      short: "Brand",    frShort: "Marque",   gradient: "from-rose-300 via-pink-500 to-violet-900",    synonyms: ["brand manager", "directeur de marque", "responsable marque"] },

  // ── Business & Strategy ────────────────────────────────────────────────────
  { id: "strategy-consultant",  category: "business", label: "Strategy Consultant", frLabel: "Consultant Stratégie",  short: "Strategy",    frShort: "Stratégie",      gradient: "from-amber-300 via-orange-500 to-rose-800",  synonyms: ["consultant en stratégie", "management consultant"] },
  { id: "business-analyst",     category: "business", label: "Business Analyst",    frLabel: "Business Analyst",      short: "Biz Analyst", frShort: "Business Analyst", gradient: "from-emerald-300 via-teal-500 to-slate-900", synonyms: ["analyste business", "ba"] },
  { id: "operations-manager",   category: "business", label: "Operations Manager",  frLabel: "Responsable Opérations", short: "Ops",        frShort: "Ops",            gradient: "from-violet-300 via-indigo-500 to-slate-900", synonyms: ["directeur des opérations", "coo", "head of operations"] },
  { id: "sales-executive",      category: "business", label: "Sales Executive",     frLabel: "Commercial",             short: "Sales",      frShort: "Commercial",     gradient: "from-yellow-300 via-amber-500 to-red-800",   synonyms: ["commercial b2b", "account executive", "business developer", "ingénieur commercial"] },

  // ── Finance ─────────────────────────────────────────────────────────────────
  { id: "financial-analyst",   category: "finance", label: "Financial Analyst",    frLabel: "Analyste Financier",     short: "Fin. Analyst", frShort: "Analyste Financier", gradient: "from-emerald-300 via-teal-500 to-slate-900", synonyms: ["analyste finance", "fp&a", "fpa"] },
  { id: "accountant",          category: "finance", label: "Accountant",           frLabel: "Comptable",              short: "Accountant",   frShort: "Comptable",          gradient: "from-cyan-300 via-teal-500 to-blue-900",     synonyms: ["comptabilité", "chief accountant", "expert-comptable"] },
  { id: "investment-analyst",  category: "finance", label: "Investment Analyst",   frLabel: "Analyste Investissement", short: "Investment",  frShort: "Investissement",     gradient: "from-yellow-200 via-amber-500 to-zinc-900",  synonyms: ["investment associate", "private equity analyst", "venture analyst"] },

  // ── Legal ───────────────────────────────────────────────────────────────────
  { id: "corporate-lawyer",  category: "legal", label: "Corporate Lawyer",  frLabel: "Avocat d'Affaires",     short: "Lawyer", frShort: "Avocat",       gradient: "from-violet-300 via-indigo-500 to-slate-900", synonyms: ["avocate", "juriste d'entreprise", "in-house counsel"] },
  { id: "ip-lawyer",         category: "legal", label: "IP Lawyer",         frLabel: "Avocat Propriété Intellectuelle", short: "IP",  frShort: "Avocat PI", gradient: "from-fuchsia-300 via-violet-500 to-slate-900", synonyms: ["intellectual property lawyer", "avocat pi"] },
  { id: "paralegal",         category: "legal", label: "Paralegal",         frLabel: "Assistant Juridique",   short: "Paralegal", frShort: "Assistant Juridique", gradient: "from-cyan-300 via-sky-500 to-slate-900", synonyms: ["legal assistant", "clerc de notaire"] },

  // ── People & HR ─────────────────────────────────────────────────────────────
  { id: "hr-manager",         category: "hr", label: "HR Manager",         frLabel: "Responsable RH",         short: "HR",        frShort: "RH",          gradient: "from-emerald-300 via-teal-500 to-slate-900", synonyms: ["human resources manager", "drh", "directeur ressources humaines"] },
  { id: "talent-acquisition", category: "hr", label: "Talent Acquisition", frLabel: "Recruteur",              short: "Recruiter", frShort: "Recruteur",   gradient: "from-cyan-300 via-sky-500 to-blue-900",      synonyms: ["recruteur tech", "recruteuse", "talent acquisition manager", "headhunter", "chasseur de têtes"] },
  { id: "people-ops",         category: "hr", label: "People Ops",         frLabel: "People Operations",      short: "People Ops", frShort: "People Ops", gradient: "from-rose-300 via-pink-500 to-purple-900",    synonyms: ["people operations", "responsable people"] },

  // ── Music & Audio ───────────────────────────────────────────────────────────
  { id: "composer",        category: "music", label: "Composer",         frLabel: "Compositeur",         short: "Composer",  frShort: "Compositeur",   gradient: "from-amber-300 via-orange-500 to-rose-800",  synonyms: ["compositrice", "music composer", "film composer"] },
  { id: "music-producer",  category: "music", label: "Music Producer",   frLabel: "Producteur Musical",  short: "Producer",  frShort: "Producteur",    gradient: "from-violet-300 via-fuchsia-500 to-indigo-900", synonyms: ["beatmaker", "music production", "réalisateur musical"] },
  { id: "sound-designer",  category: "music", label: "Sound Designer",   frLabel: "Sound Designer",      short: "Sound",     frShort: "Sound",          gradient: "from-cyan-300 via-sky-500 to-indigo-900",    synonyms: ["designer sonore", "sound design", "foley artist"] },
  { id: "mixing-engineer", category: "music", label: "Mixing Engineer",  frLabel: "Ingénieur du Son",    short: "Mixing",    frShort: "Mixage",         gradient: "from-yellow-300 via-amber-500 to-red-800",   synonyms: ["mastering engineer", "ingénieur mixage", "audio engineer"] },

  // ── Architecture & Construction ────────────────────────────────────────────
  { id: "architect",         category: "architecture", label: "Architect",         frLabel: "Architecte",          short: "Architect", frShort: "Architecte",    gradient: "from-yellow-200 via-amber-500 to-zinc-900",  synonyms: ["architecte dplg", "architecte d'intérieur"] },
  { id: "interior-designer", category: "architecture", label: "Interior Designer", frLabel: "Architecte d'Intérieur", short: "Interior", frShort: "Archi. Intérieur", gradient: "from-rose-300 via-pink-500 to-purple-900", synonyms: ["designer intérieur", "décorateur d'intérieur", "interior design"] },
  { id: "urban-planner",     category: "architecture", label: "Urban Planner",     frLabel: "Urbaniste",           short: "Urban",     frShort: "Urbaniste",     gradient: "from-emerald-300 via-teal-600 to-slate-900",  synonyms: ["urbanisme", "planification urbaine"] },

  // ── Hardware & Industrial ──────────────────────────────────────────────────
  { id: "mechanical-engineer", category: "engineering", label: "Mechanical Engineer", frLabel: "Ingénieur Mécanique", short: "Mechanical", frShort: "Mécanique",     gradient: "from-violet-300 via-indigo-500 to-slate-900", synonyms: ["ingénieur méca", "mechanical design engineer"] },
  { id: "electrical-engineer", category: "engineering", label: "Electrical Engineer", frLabel: "Ingénieur Électrique", short: "Electrical", frShort: "Électrique",   gradient: "from-cyan-300 via-sky-500 to-blue-900",       synonyms: ["ingénieur élec", "electronics engineer"] },
  { id: "industrial-designer", category: "engineering", label: "Industrial Designer", frLabel: "Designer Industriel", short: "Industrial", frShort: "Designer Indu.", gradient: "from-rose-300 via-pink-500 to-purple-900",    synonyms: ["product industrial designer", "design industriel"] },

  // ── Health ──────────────────────────────────────────────────────────────────
  { id: "medical-doctor",   category: "health", label: "Medical Doctor",   frLabel: "Médecin",            short: "Doctor",     frShort: "Médecin",      gradient: "from-rose-300 via-red-500 to-purple-900",   synonyms: ["docteur", "médecin généraliste", "physician", "doctor"] },
  { id: "nurse",            category: "health", label: "Nurse",            frLabel: "Infirmier",          short: "Nurse",       frShort: "Infirmier",   gradient: "from-pink-300 via-rose-500 to-red-800",     synonyms: ["infirmière", "ide", "infirmier diplômé d'état", "nurse practitioner"] },
  { id: "physiotherapist",  category: "health", label: "Physiotherapist",  frLabel: "Kinésithérapeute",   short: "Physio",     frShort: "Kiné",         gradient: "from-emerald-300 via-teal-500 to-slate-900", synonyms: ["physical therapist", "kiné", "ostéopathe"] },
  { id: "pharmacist",       category: "health", label: "Pharmacist",       frLabel: "Pharmacien",         short: "Pharmacist", frShort: "Pharmacien",   gradient: "from-emerald-300 via-green-500 to-slate-900", synonyms: ["pharmacienne", "pharmacy"] },
  { id: "midwife",          category: "health", label: "Midwife",          frLabel: "Sage-Femme",         short: "Midwife",    frShort: "Sage-Femme",   gradient: "from-rose-200 via-pink-400 to-purple-700",   synonyms: ["sage femme", "maïeuticien"] },
  { id: "dentist",          category: "health", label: "Dentist",          frLabel: "Dentiste",           short: "Dentist",    frShort: "Dentiste",     gradient: "from-cyan-200 via-blue-400 to-slate-700",    synonyms: ["chirurgien-dentiste", "dental surgeon"] },
  { id: "psychologist",     category: "health", label: "Psychologist",     frLabel: "Psychologue",        short: "Psychologist", frShort: "Psy",        gradient: "from-violet-300 via-purple-500 to-indigo-900", synonyms: ["psy", "psychothérapeute", "therapist"] },

  // ── Education ───────────────────────────────────────────────────────────────
  { id: "researcher", category: "education", label: "Researcher",          frLabel: "Chercheur",            short: "Research", frShort: "Chercheur",    gradient: "from-violet-300 via-indigo-500 to-slate-900", synonyms: ["chercheuse", "scientific researcher", "phd researcher"] },
  { id: "teacher",    category: "education", label: "Teacher / Trainer",   frLabel: "Enseignant",           short: "Teacher",  frShort: "Enseignant",   gradient: "from-amber-300 via-orange-500 to-rose-800",  synonyms: ["professeur", "trainer", "formateur", "instructor", "prof"] },

  // ── Media & Communication ──────────────────────────────────────────────────
  { id: "journalist", category: "media", label: "Journalist",  frLabel: "Journaliste",   short: "Journalist", frShort: "Journaliste", gradient: "from-cyan-300 via-sky-500 to-indigo-900",    synonyms: ["reporter", "journaliste presse écrite", "journaliste tv"] },
  { id: "copywriter", category: "media", label: "Copywriter",  frLabel: "Concepteur-Rédacteur", short: "Copywriter", frShort: "Rédacteur", gradient: "from-yellow-300 via-amber-500 to-red-800", synonyms: ["rédacteur publicitaire", "concepteur rédacteur", "writer publicitaire"] },
  { id: "translator", category: "media", label: "Translator",  frLabel: "Traducteur",    short: "Translator", frShort: "Traducteur",   gradient: "from-violet-300 via-fuchsia-500 to-indigo-900", synonyms: ["traductrice", "interprète", "interpreter"] },

  // ── Logistics ───────────────────────────────────────────────────────────────
  { id: "supply-chain-manager",   category: "logistics", label: "Supply Chain Manager", frLabel: "Responsable Supply Chain", short: "Supply Chain", frShort: "Supply Chain", gradient: "from-emerald-300 via-teal-500 to-slate-900", synonyms: ["supply chain", "chaîne logistique"] },
  { id: "logistics-coordinator",  category: "logistics", label: "Logistics Coordinator", frLabel: "Coordinateur Logistique", short: "Logistics",    frShort: "Logistique",   gradient: "from-cyan-300 via-sky-500 to-slate-900",     synonyms: ["responsable logistique", "logistique"] },

  // ── Hospitality & Food ─────────────────────────────────────────────────────
  { id: "chef",          category: "hospitality", label: "Chef",          frLabel: "Chef Cuisinier", short: "Chef",         frShort: "Chef",          gradient: "from-amber-300 via-orange-500 to-red-800",  synonyms: ["cuisinier", "cuisinière", "head chef", "sous-chef", "executive chef"] },
  { id: "pastry-chef",   category: "hospitality", label: "Pastry Chef",   frLabel: "Pâtissier",       short: "Pastry",       frShort: "Pâtissier",     gradient: "from-pink-200 via-amber-400 to-rose-700",   synonyms: ["pâtissière", "patissier", "patissiere", "pastry", "chocolatier"] },
  { id: "baker",         category: "hospitality", label: "Baker",         frLabel: "Boulanger",       short: "Baker",        frShort: "Boulanger",     gradient: "from-yellow-200 via-amber-500 to-orange-700", synonyms: ["boulangère", "boulangerie", "bread maker", "artisan boulanger"] },
  { id: "butcher",       category: "hospitality", label: "Butcher",       frLabel: "Boucher",         short: "Butcher",      frShort: "Boucher",       gradient: "from-rose-300 via-red-500 to-zinc-800",     synonyms: ["bouchère", "boucherie", "charcutier"] },
  { id: "bartender",     category: "hospitality", label: "Bartender",     frLabel: "Barman",          short: "Bartender",    frShort: "Barman",        gradient: "from-amber-300 via-orange-600 to-rose-900", synonyms: ["barmaid", "mixologue", "mixologist"] },
  { id: "sommelier",     category: "hospitality", label: "Sommelier",     frLabel: "Sommelier",       short: "Sommelier",    frShort: "Sommelier",     gradient: "from-rose-300 via-amber-500 to-red-900",    synonyms: ["sommelière", "wine expert"] },
  { id: "waiter",        category: "hospitality", label: "Waiter",        frLabel: "Serveur",         short: "Waiter",       frShort: "Serveur",       gradient: "from-amber-200 via-orange-400 to-red-700",  synonyms: ["serveuse", "waitress", "server", "maître d'hôtel"] },
  { id: "hotel-manager", category: "hospitality", label: "Hotel Manager", frLabel: "Directeur d'Hôtel", short: "Hotel",      frShort: "Direction Hôtel", gradient: "from-yellow-200 via-amber-500 to-zinc-900", synonyms: ["responsable hôtel", "general manager hotel"] },

  // ── Skilled Trades ─────────────────────────────────────────────────────────
  { id: "carpenter",     category: "trades", label: "Carpenter",     frLabel: "Charpentier",     short: "Carpenter",   frShort: "Charpentier",   gradient: "from-amber-300 via-orange-600 to-zinc-900",  synonyms: ["menuisier", "ébéniste", "joiner"] },
  { id: "plumber",       category: "trades", label: "Plumber",       frLabel: "Plombier",        short: "Plumber",     frShort: "Plombier",      gradient: "from-cyan-300 via-sky-600 to-slate-900",     synonyms: ["plombière", "chauffagiste"] },
  { id: "electrician",   category: "trades", label: "Electrician",   frLabel: "Électricien",     short: "Electrician", frShort: "Électricien",   gradient: "from-yellow-300 via-amber-500 to-zinc-900",  synonyms: ["électricienne", "electric installer"] },
  { id: "mason",         category: "trades", label: "Mason",         frLabel: "Maçon",           short: "Mason",       frShort: "Maçon",         gradient: "from-stone-300 via-amber-700 to-zinc-900",   synonyms: ["maçonne", "bricklayer", "masonry"] },
  { id: "welder",        category: "trades", label: "Welder",        frLabel: "Soudeur",         short: "Welder",      frShort: "Soudeur",       gradient: "from-orange-300 via-red-600 to-zinc-900",    synonyms: ["soudeuse", "welder fabricator"] },
  { id: "mechanic",      category: "trades", label: "Auto Mechanic", frLabel: "Mécanicien Auto",  short: "Mechanic",    frShort: "Mécanicien",    gradient: "from-zinc-300 via-slate-500 to-zinc-900",    synonyms: ["mécanicienne", "garage mechanic", "auto repair"] },
  { id: "tailor",        category: "trades", label: "Tailor",        frLabel: "Tailleur",        short: "Tailor",      frShort: "Tailleur",      gradient: "from-rose-300 via-pink-500 to-purple-900",   synonyms: ["couturier", "couturière", "seamstress"] },

  // ── Other ───────────────────────────────────────────────────────────────────
  { id: "other", category: "other", label: "Other", frLabel: "Autre", short: "Other", frShort: "Autre", gradient: "from-mist-300 via-mist-500 to-slate-900" },
];

// ── Discipline (legacy) → Profession mapping ─────────────────────────────────
// Used to migrate older mock talents and any DB profile still on the discipline
// field. The legacy DisciplineId set lives in lib/disciplines.ts.
export const DISCIPLINE_TO_PROFESSION: Record<string, string> = {
  "animation-3d":     "animation-3d",
  "unreal":           "unreal-artist",
  "motion-design":    "motion-designer",
  "vfx":              "vfx-artist",
  "storyboard":       "storyboard-artist",
  "character-art":    "character-artist",
  "environment-art":  "environment-artist",
  "generalist-3d":    "3d-generalist",
  "editing":          "video-editor",
  "visual-direction": "visual-director",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getProfession(id: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.id === id);
}

export function getCategory(id: ProfessionCategoryId): ProfessionCategory | undefined {
  return PROFESSION_CATEGORIES.find((c) => c.id === id);
}

export function professionsByCategory(): Record<ProfessionCategoryId, Profession[]> {
  const map = {} as Record<ProfessionCategoryId, Profession[]>;
  for (const cat of PROFESSION_CATEGORIES) map[cat.id] = [];
  for (const p of PROFESSIONS) map[p.category].push(p);
  return map;
}

/** Normalize a raw text input for fuzzy matching:
 *  - lowercase
 *  - strip diacritics (é → e, à → a, ñ → n)
 *  - collapse non-alphanumeric to single space, trim
 *  - drop common stopwords (a/the/le/la/du/de/en) */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(a|the|le|la|les|de|du|des|en|of|and|et)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Slugify a raw text input to a URL-safe profession id candidate. */
export function slugifyProfessionName(s: string): string {
  return normalizeName(s).replace(/\s+/g, "-");
}

/** Find a profession whose id, label, frLabel, or any synonym matches `raw`
 *  (after normalization). Returns null if nothing matches. */
export function findProfessionByQuery(raw: string): Profession | null {
  if (!raw) return null;
  const needle = normalizeName(raw);
  if (!needle) return null;

  for (const p of PROFESSIONS) {
    if (normalizeName(p.id) === needle) return p;
    if (normalizeName(p.label) === needle) return p;
    if (normalizeName(p.frLabel) === needle) return p;
    if (p.synonyms?.some((syn) => normalizeName(syn) === needle)) return p;
  }
  // Fuzzy: needle contained in any label/synonym (or vice versa)
  for (const p of PROFESSIONS) {
    const hay = [p.label, p.frLabel, ...(p.synonyms ?? [])]
      .map(normalizeName)
      .filter(Boolean);
    if (hay.some((h) => h === needle || h.includes(needle) || needle.includes(h))) return p;
  }
  return null;
}

/** Locale-aware display label (FR is the default locale). */
export function professionLabel(p: Profession, locale: "fr" | "en" = "fr"): string {
  return locale === "fr" ? p.frLabel : p.label;
}

export function professionShort(p: Profession, locale: "fr" | "en" = "fr"): string {
  return locale === "fr" ? p.frShort : p.short;
}

export function categoryLabel(c: ProfessionCategory, locale: "fr" | "en" = "fr"): string {
  return locale === "fr" ? c.frLabel : c.label;
}
