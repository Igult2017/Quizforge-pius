// Comprehensive subject areas and topics for nursing exam questions
// This ensures comprehensive coverage across all learning areas

export interface SubjectArea {
  name: string;
  topics: string[];
  questionCount: number; // Target number of questions
  difficulties: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface ExamConfig {
  subjects: SubjectArea[];
  totalQuestions: number;
}

// NCLEX Subject Areas - Based on NCLEX-RN Test Plan
export const NCLEX_SUBJECTS: SubjectArea[] = [
  {
    name: "Management of Care",
    questionCount: 850,
    difficulties: { easy: 250, medium: 400, hard: 200 },
    topics: [
      "Advance Directives",
      "Advocacy",
      "Case Management",
      "Client Rights",
      "Collaboration with Interdisciplinary Team",
      "Concepts of Management",
      "Confidentiality/Information Security",
      "Continuity of Care",
      "Establishing Priorities",
      "Ethical Practice",
      "Informed Consent",
      "Information Technology",
      "Legal Rights and Responsibilities",
      "Performance Improvement (Quality Improvement)",
      "Referrals",
      "Supervision"
    ]
  },
  {
    name: "Safety and Infection Control",
    questionCount: 600,
    difficulties: { easy: 200, medium: 300, hard: 100 },
    topics: [
      "Accident/Error/Injury Prevention",
      "Emergency Response Plan",
      "Ergonomic Principles",
      "Handling Hazardous and Infectious Materials",
      "Home Safety",
      "Reporting of Incident/Event/Irregular Occurrence/Variance",
      "Safe Use of Equipment",
      "Security Plan",
      "Standard Precautions/Transmission-Based Precautions",
      "Use of Restraints/Safety Devices"
    ]
  },
  {
    name: "Health Promotion and Maintenance",
    questionCount: 850,
    difficulties: { easy: 300, medium: 400, hard: 150 },
    topics: [
      "Aging Process",
      "Ante/Intra/Postpartum and Newborn Care",
      "Developmental Stages and Transitions",
      "Disease Prevention",
      "Health Promotion Programs",
      "Health Screening",
      "High Risk Behaviors",
      "Lifestyle Choices",
      "Self-Care",
      "Techniques of Physical Assessment"
    ]
  },
  {
    name: "Psychosocial Integrity",
    questionCount: 850,
    difficulties: { easy: 250, medium: 400, hard: 200 },
    topics: [
      "Abuse/Neglect",
      "Behavioral Interventions",
      "Chemical and Other Dependencies",
      "Coping Mechanisms",
      "Crisis Intervention",
      "Cultural Awareness/Diversity",
      "End of Life Care",
      "Family Dynamics",
      "Grief and Loss",
      "Mental Health Concepts",
      "Religious and Spiritual Influences on Health",
      "Sensory/Perceptual Alterations",
      "Stress Management",
      "Support Systems",
      "Therapeutic Communications",
      "Therapeutic Environment"
    ]
  },
  {
    name: "Basic Care and Comfort",
    questionCount: 600,
    difficulties: { easy: 250, medium: 250, hard: 100 },
    topics: [
      "Assistive Devices",
      "Elimination",
      "Mobility/Immobility",
      "Non-Pharmacological Comfort Interventions",
      "Nutrition and Oral Hydration",
      "Palliative/Comfort Care",
      "Personal Hygiene",
      "Rest and Sleep"
    ]
  },
  {
    name: "Pharmacological and Parenteral Therapies",
    questionCount: 1100,
    difficulties: { easy: 300, medium: 550, hard: 250 },
    topics: [
      "Adverse Effects/Contraindications/Side Effects/Interactions",
      "Blood and Blood Products",
      "Central Venous Access Devices",
      "Dosage Calculation",
      "Expected Actions/Outcomes",
      "Medication Administration",
      "Pharmacological Pain Management",
      "Parenteral/Intravenous Therapies",
      "Total Parenteral Nutrition"
    ]
  },
  {
    name: "Reduction of Risk Potential",
    questionCount: 650,
    difficulties: { easy: 200, medium: 300, hard: 150 },
    topics: [
      "Changes/Abnormalities in Vital Signs",
      "Diagnostic Tests",
      "Laboratory Values",
      "Potential for Alterations in Body Systems",
      "Potential for Complications of Diagnostic Tests/Treatments/Procedures",
      "Potential for Complications from Surgical Procedures and Health Alterations",
      "System Specific Assessments",
      "Therapeutic Procedures"
    ]
  },
  {
    name: "Physiological Adaptation",
    questionCount: 1500,
    difficulties: { easy: 400, medium: 750, hard: 350 },
    topics: [
      "Alterations in Body Systems",
      "Fluid and Electrolyte Imbalances",
      "Hemodynamics",
      "Illness Management",
      "Medical Emergencies",
      "Pathophysiology",
      "Radiation Therapy",
      "Unexpected Response to Therapies",
      "Cardiovascular Disorders",
      "Respiratory Disorders",
      "Neurological Disorders",
      "Gastrointestinal Disorders",
      "Renal and Urological Disorders",
      "Endocrine Disorders",
      "Musculoskeletal Disorders",
      "Hematologic Disorders",
      "Immunologic Disorders"
    ]
  }
];

// ATI TEAS Subject Areas - Based on ATI TEAS 7 Test Plan
export const TEAS_SUBJECTS: SubjectArea[] = [
  {
    name: "Reading",
    questionCount: 600,
    difficulties: { easy: 250, medium: 250, hard: 100 },
    topics: [
      "Key Ideas and Details",
      "Craft and Structure",
      "Integration of Knowledge and Ideas",
      "Main Ideas and Supporting Details",
      "Inferences and Conclusions",
      "Author's Purpose and Point of View",
      "Text Structure",
      "Word Meanings and Context Clues",
      "Evaluating Arguments",
      "Compare and Contrast Texts"
    ]
  },
  {
    name: "Mathematics",
    questionCount: 700,
    difficulties: { easy: 300, medium: 300, hard: 100 },
    topics: [
      "Numbers and Algebra",
      "Arithmetic Operations",
      "Fractions, Decimals, and Percentages",
      "Ratios and Proportions",
      "Algebraic Expressions and Equations",
      "Measurements and Data",
      "Unit Conversions",
      "Data Interpretation",
      "Statistics and Probability",
      "Geometric Principles"
    ]
  },
  {
    name: "Science",
    questionCount: 850,
    difficulties: { easy: 300, medium: 400, hard: 150 },
    topics: [
      "Human Anatomy and Physiology",
      "Cardiovascular System",
      "Respiratory System",
      "Nervous System",
      "Digestive System",
      "Endocrine System",
      "Musculoskeletal System",
      "Integumentary System",
      "Life and Physical Sciences",
      "Cell Structure and Function",
      "Genetics and DNA",
      "Scientific Reasoning",
      "Chemistry Basics",
      "Atoms and Molecules",
      "Chemical Reactions",
      "Properties of Matter"
    ]
  },
  {
    name: "English and Language Usage",
    questionCount: 350,
    difficulties: { easy: 150, medium: 150, hard: 50 },
    topics: [
      "Conventions of Standard English",
      "Grammar and Sentence Structure",
      "Punctuation",
      "Spelling",
      "Capitalization",
      "Knowledge of Language",
      "Vocabulary Acquisition",
      "Using Context Clues",
      "Word Roots and Affixes"
    ]
  }
];

// HESI A2 Subject Areas - Based on HESI A2 Exam Structure
export const HESI_SUBJECTS: SubjectArea[] = [
  {
    name: "Mathematics",
    questionCount: 500,
    difficulties: { easy: 200, medium: 200, hard: 100 },
    topics: [
      "Basic Operations",
      "Fractions and Decimals",
      "Percentages",
      "Ratios and Proportions",
      "Measurement Conversions",
      "Dosage Calculations",
      "Household Measures",
      "Metric Conversions",
      "Roman Numerals"
    ]
  },
  {
    name: "Reading Comprehension",
    questionCount: 400,
    difficulties: { easy: 150, medium: 200, hard: 50 },
    topics: [
      "Main Ideas",
      "Supporting Details",
      "Inferences",
      "Author's Purpose",
      "Fact vs Opinion",
      "Following Directions",
      "Context Clues",
      "Drawing Conclusions"
    ]
  },
  {
    name: "Vocabulary",
    questionCount: 300,
    difficulties: { easy: 150, medium: 100, hard: 50 },
    topics: [
      "Medical Terminology",
      "Word Roots",
      "Prefixes and Suffixes",
      "Context in Healthcare",
      "Synonyms and Antonyms"
    ]
  },
  {
    name: "Grammar",
    questionCount: 300,
    difficulties: { easy: 150, medium: 100, hard: 50 },
    topics: [
      "Parts of Speech",
      "Sentence Structure",
      "Subject-Verb Agreement",
      "Verb Tenses",
      "Pronouns",
      "Punctuation",
      "Common Grammar Errors"
    ]
  },
  {
    name: "Biology",
    questionCount: 450,
    difficulties: { easy: 150, medium: 250, hard: 50 },
    topics: [
      "Cell Structure and Function",
      "Cellular Respiration",
      "Photosynthesis",
      "DNA and RNA",
      "Genetics and Heredity",
      "Biological Macromolecules",
      "Metabolism"
    ]
  },
  {
    name: "Chemistry",
    questionCount: 350,
    difficulties: { easy: 150, medium: 150, hard: 50 },
    topics: [
      "Atomic Structure",
      "Periodic Table",
      "Chemical Bonds",
      "Chemical Reactions",
      "Acids and Bases",
      "Solutions and Concentrations",
      "States of Matter"
    ]
  },
  {
    name: "Anatomy and Physiology",
    questionCount: 700,
    difficulties: { easy: 250, medium: 350, hard: 100 },
    topics: [
      "Anatomical Terminology",
      "Body Organization",
      "Cardiovascular System",
      "Respiratory System",
      "Nervous System",
      "Digestive System",
      "Endocrine System",
      "Musculoskeletal System",
      "Integumentary System",
      "Urinary System",
      "Reproductive System",
      "Lymphatic and Immune System"
    ]
  }
];

// Exam configurations
export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  NCLEX: {
    subjects: NCLEX_SUBJECTS,
    totalQuestions: NCLEX_SUBJECTS.reduce((sum, s) => sum + s.questionCount, 0)
  },
  TEAS: {
    subjects: TEAS_SUBJECTS,
    totalQuestions: TEAS_SUBJECTS.reduce((sum, s) => sum + s.questionCount, 0)
  },
  HESI: {
    subjects: HESI_SUBJECTS,
    totalQuestions: HESI_SUBJECTS.reduce((sum, s) => sum + s.questionCount, 0)
  }
};

// Helper function to get total questions across all exams
export function getTotalQuestionCount(): number {
  return Object.values(EXAM_CONFIGS).reduce((sum, config) => sum + config.totalQuestions, 0);
}

// Helper function to get subjects for a category
export function getSubjectsForCategory(category: "NCLEX" | "TEAS" | "HESI"): SubjectArea[] {
  return EXAM_CONFIGS[category]?.subjects || [];
}
