// Starter listings from the C1 cohort sheet. Loaded once when the Google Sheet is set up
// (or used directly in local development). Edit them from the admin panel afterwards.
import { cleanRecord } from "./practitioners";

const rows = [
  {
    id: "tanvi", order: 1, name: "Tanvi", role: "Psychologist", place: "",
    badges: ["Enso's clinical advisor"],
    summary: "Enso's clinical advisor, and the first practitioner to see Enso members.",
    concerns: [], ways: [], languages: [], avail: [], fee: "", exp: "", education: []
  },
  {
    id: "urvashi-jain", order: 2, name: "Urvashi Jain", role: "Rehabilitation psychologist", place: "Jalandhar, Punjab",
    badges: ["RCI registered"],
    summary: "Works with anxiety, low mood, trauma, grief and work stress, mainly through CBT, ACT and person-centred therapy.",
    concerns: ["Anxiety", "Low mood & depression", "Trauma", "Relationships", "Grief & loss", "Work stress & burnout"],
    ways: ["CBT", "Person-centred", "ACT"], languages: ["English", "Hindi"], avail: ["Weekday mornings", "Weekday afternoons", "Weekends"],
    fee: 1800, exp: "7–10 years",
    education: ["MPhil, Rehabilitation Psychology", "Registered with the Rehabilitation Council of India"]
  },
  {
    id: "shraddha-modi", order: 3, name: "Shraddha Sanjay Modi", role: "Psychologist and hypnotherapist", place: "Bengaluru",
    badges: [],
    summary: "Combines talk therapy with art, drama, play and hypnotherapy. Sees individuals, teens and couples.",
    concerns: ["Anxiety", "Trauma", "Relationships", "Grief & loss", "Work stress & burnout", "Self-esteem & identity", "Teens", "Couples"],
    ways: ["CBT", "Psychodynamic", "Art therapy", "Drama therapy", "Play therapy", "Hypnotherapy"],
    languages: ["English", "Hindi", "Gujarati"], avail: ["Weekday mornings", "Weekday evenings"], fee: 2000, exp: "7–10 years",
    education: ["MA, Clinical Psychology", "PG Diploma in Clinical Hypnosis"]
  },
  {
    id: "iqra-hameed", order: 4, name: "Iqra Hameed", role: "Counselling psychologist", place: "Srinagar, Kashmir",
    badges: [],
    summary: "Works with anxiety, low mood, trauma and self-esteem, including with teens. Sessions in English, Hindi, Kashmiri and Urdu.",
    concerns: ["Anxiety", "Low mood & depression", "Trauma", "Self-esteem & identity", "Teens"],
    ways: ["CBT", "Psychodynamic", "Person-centred", "ACT", "DBT", "Existential"],
    languages: ["English", "Hindi", "Kashmiri", "Urdu"], avail: ["Weekday mornings", "Weekday evenings"], fee: 1200, exp: "7–10 years",
    education: ["MA, Counselling Psychology"]
  },
  {
    id: "sugam-bharti", order: 5, name: "Sugam Bharti", role: "Counselling psychologist", place: "Mumbai",
    badges: [],
    summary: "Works with anxiety, work stress, self-esteem and personal growth, drawing on psychodynamic, person-centred and philosophical counselling.",
    concerns: ["Anxiety", "Work stress & burnout", "Self-esteem & identity", "Teens", "Personal growth"],
    ways: ["CBT", "Psychodynamic", "Person-centred", "ACT", "Philosophical counselling", "Eclectic"],
    languages: ["English", "Hindi"], avail: ["Weekday mornings", "Weekday evenings"], availNote: "Also available all day on Mondays and Tuesdays.",
    fee: 1500, exp: "4–6 years", education: ["MA, Counselling Psychology"]
  },
  {
    id: "riya-kashyap", order: 6, name: "Riya Kashyap", role: "Psychologist", place: "Bhiwadi, Rajasthan",
    badges: [],
    summary: "Works with trauma, grief, relationships and anxiety using CBT, ACT and EMDR. Sees individuals, teens and couples.",
    concerns: ["Anxiety", "Low mood & depression", "Trauma", "Relationships", "Grief & loss", "Work stress & burnout", "Self-esteem & identity", "Teens", "Couples"],
    ways: ["CBT", "Person-centred", "EMDR", "ACT"], languages: ["English", "Hindi"], avail: ["Weekday mornings", "Weekday afternoons", "Weekends"],
    fee: 1500, exp: "2–3 years", education: ["MPhil, Clinical Psychology"]
  },
  {
    id: "vidhi-chanpura", order: 7, name: "Vidhi Chanpura", role: "Psychologist and art therapist", place: "Daman",
    badges: [],
    summary: "Combines talk therapy with art therapy and expressive arts. Works with anxiety, low mood, grief and relationships.",
    concerns: ["Anxiety", "Low mood & depression", "Relationships", "Grief & loss", "Work stress & burnout", "Self-esteem & identity"],
    ways: ["CBT", "Psychodynamic", "Person-centred", "ACT", "DBT", "Art therapy", "Expressive arts"],
    languages: ["English", "Hindi", "Gujarati"], avail: ["Weekday evenings"], fee: 1200, exp: "2–3 years",
    education: ["MA, Clinical Psychology", "Diploma in Art Therapy, Asha The Hope"]
  },
  {
    id: "sarthak-parikh", order: 8, name: "Sarthak Parikh", role: "Counselling psychologist", place: "Mumbai",
    badges: [],
    summary: "Practical, goal-focused work using CBT, DBT and solution-focused therapy, with a focus on work stress, career questions and teens.",
    concerns: ["Anxiety", "Relationships", "Work stress & burnout", "Self-esteem & identity", "Teens"],
    ways: ["CBT", "DBT", "Solution-focused", "Career counselling"], languages: ["English", "Hindi"], avail: ["Weekday mornings", "Weekday afternoons"],
    fee: 1500, exp: "2–3 years", education: ["MSc, Counselling Psychology"]
  },
  {
    id: "aarshi-kumar", order: 9, name: "Aarshi Kumar", role: "Psychologist", place: "Mumbai",
    badges: [],
    summary: "Works with anxiety, low mood, trauma and relationships, and is training in integrated somatic therapy.",
    concerns: ["Anxiety", "Low mood & depression", "Trauma", "Relationships", "Self-esteem & identity"],
    ways: ["Somatic (in training)"], languages: ["English", "Hindi"], avail: ["Weekday evenings"], fee: 1000, exp: "2–3 years",
    education: ["MA, Clinical Psychology"]
  },
  {
    id: "aakriti-talwar", order: 10, name: "Aakriti Talwar", role: "Psychologist", place: "Delhi",
    badges: [],
    summary: "A person-centred, creative approach using ACT and expressive arts. Works with anxiety, trauma, relationships and teens.",
    concerns: ["Anxiety", "Low mood & depression", "Trauma", "Relationships", "Work stress & burnout", "Self-esteem & identity", "Teens"],
    ways: ["Person-centred", "ACT", "Expressive arts"], languages: ["English", "Hindi"], avail: ["Weekday afternoons", "Weekday evenings", "Weekends"],
    fee: 650, exp: "2–3 years", education: ["MA, Clinical Psychology"]
  }
];

export const SEED = rows.map((r) => cleanRecord({ status: "Published", ...r }));
