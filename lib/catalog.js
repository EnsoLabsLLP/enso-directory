// Shared lists used by the directory, the admin panel and the Google Sheet.
// Labels are what appears in the sheet, so practitioners' rows stay readable there.

export const CONCERNS = [
  { id: "anxiety", label: "Anxiety", icon: "wind" },
  { id: "depression", label: "Low mood & depression", icon: "cloud-rain" },
  { id: "trauma", label: "Trauma", icon: "shield-half" },
  { id: "relationships", label: "Relationships", icon: "heart-handshake" },
  { id: "grief", label: "Grief & loss", icon: "leaf" },
  { id: "burnout", label: "Work stress & burnout", icon: "battery-low" },
  { id: "selfesteem", label: "Self-esteem & identity", icon: "user-round" },
  { id: "teens", label: "Teens", icon: "backpack" },
  { id: "couples", label: "Couples", icon: "users-round" },
  { id: "growth", label: "Personal growth", icon: "sprout" }
];

export const TIMES = [
  { id: "m", label: "Weekday mornings", days: "Mon–Fri", icon: "sunrise", aliases: ["mornings", "morning", "weekday morning"] },
  { id: "a", label: "Weekday afternoons", days: "Mon–Fri", icon: "sun", aliases: ["afternoons", "afternoon", "weekday afternoon"] },
  { id: "e", label: "Weekday evenings", days: "Mon–Fri", icon: "sunset", aliases: ["evenings", "evening", "weekday evening"] },
  { id: "w", label: "Weekends", days: "Sat–Sun", icon: "calendar-days", aliases: ["weekend", "saturday", "sunday", "weekends"] }
];

export const FEES = [
  { id: "lt1000", label: "Under ₹1,000", min: 0, max: 999 },
  { id: "1000-1500", label: "₹1,000 – ₹1,500", min: 1000, max: 1500 },
  { id: "gt1500", label: "Above ₹1,500", min: 1501, max: Infinity }
];

export const EXPERIENCE = [
  { label: "Under 2 years", years: 1 },
  { label: "2–3 years", years: 2.5 },
  { label: "4–6 years", years: 5 },
  { label: "7–10 years", years: 8.5 },
  { label: "10+ years", years: 12 }
];

export const BADGE_PRESETS = ["RCI registered", "Enso's clinical advisor"];

export const WAYS = [
  { id: "cbt", short: "CBT", name: "Cognitive behavioural therapy (CBT)", about: "Looks at how thoughts, feelings and actions feed into each other, and builds practical skills to change patterns that keep you stuck." },
  { id: "dbt", short: "DBT", name: "Dialectical behaviour therapy (DBT)", about: "Skills for riding out intense emotions, handling distress and keeping relationships steady." },
  { id: "act", short: "ACT", name: "Acceptance and commitment therapy (ACT)", about: "Helps you make room for difficult thoughts and feelings while moving towards what matters to you." },
  { id: "sfbt", short: "Solution-focused", name: "Solution-focused brief therapy (SFBT)", about: "Short-term, goal-focused work that builds on what is already working in your life." },
  { id: "psychodynamic", short: "Psychodynamic", name: "Psychodynamic therapy", about: "Explores how earlier experiences and less visible patterns shape how you feel and relate today." },
  { id: "person", short: "Person-centred", name: "Person-centred therapy", about: "A warm, non-judgemental space where you set the pace and the therapist follows your lead." },
  { id: "existential", short: "Existential", name: "Existential therapy", about: "Makes room for big questions about meaning, choice, loss and purpose." },
  { id: "narrative", short: "Narrative", name: "Narrative therapy", about: "Helps you step back from the stories you tell about yourself and rewrite the ones that hold you back." },
  { id: "ifs", short: "IFS", name: "Internal family systems (IFS)", about: "Works with the different 'parts' of you with curiosity, so they can stop pulling against each other." },
  { id: "emdr", short: "EMDR", name: "EMDR", about: "A structured therapy that helps the mind process distressing or traumatic memories." },
  { id: "art", short: "Art therapy", name: "Art therapy", about: "Uses drawing, painting and making to express what is hard to put into words.", creative: true },
  { id: "expressive", short: "Expressive arts", name: "Expressive arts", about: "Brings together art, movement, writing and play as ways to explore feelings.", creative: true },
  { id: "drama", short: "Drama therapy", name: "Drama therapy", about: "Uses role-play, story and enactment to look at experiences from a safe distance.", creative: true },
  { id: "play", short: "Play therapy", name: "Play therapy", about: "Uses play as a language for working through feelings, especially with younger clients.", creative: true },
  { id: "music", short: "Music therapy", name: "Music therapy", about: "Uses listening, rhythm and making music to reach feelings that are hard to talk about.", creative: true },
  { id: "movement", short: "Dance & movement", name: "Dance and movement therapy", about: "Uses movement and the body as a way into emotions and memories.", creative: true },
  { id: "somatic", short: "Somatic", name: "Somatic therapy", about: "Pays attention to how stress and emotion show up in the body." },
  { id: "hypno", short: "Hypnotherapy", name: "Hypnotherapy", about: "Uses guided, focused relaxation to work with stress, anxiety and habits." },
  { id: "mindfulness", short: "Mindfulness", name: "Mindfulness-based therapy", about: "Builds the habit of noticing thoughts and feelings without getting swept up in them." },
  { id: "career", short: "Career counselling", name: "Career counselling", about: "Guidance on study and career choices, transitions and direction at work." },
  { id: "philosophical", short: "Philosophical counselling", name: "Philosophical counselling", about: "Thinks through life questions and values with the help of philosophical ideas." },
  { id: "eclectic", short: "Eclectic", name: "Eclectic approach", about: "Draws on different methods and shapes the work around what you need." }
];

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function findConcern(label) {
  const n = norm(label);
  return CONCERNS.find((c) => norm(c.label) === n || c.id === n) || null;
}
export function findWay(label) {
  const n = norm(label).replace(/ in training$/, "");
  return WAYS.find((w) => norm(w.short) === n || norm(w.name) === n || w.id === n) || null;
}
export function findTime(label) {
  const n = norm(label);
  return TIMES.find((t) => norm(t.label) === n || t.id === n || t.aliases.includes(n)) || null;
}
export function experienceYears(label) {
  const hit = EXPERIENCE.find((e) => norm(e.label) === norm(label));
  if (hit) return hit.years;
  const nums = String(label || "").match(/\d+/g);
  return nums ? nums.map(Number).reduce((a, b) => a + b, 0) / nums.length : 0;
}

// What the public page needs to render filters, tiles and explanations.
export const PUBLIC_CATALOG = {
  concerns: CONCERNS,
  times: TIMES,
  fees: FEES.map(({ id, label, min, max }) => ({ id, label, min, max: max === Infinity ? null : max })),
  ways: WAYS
};
