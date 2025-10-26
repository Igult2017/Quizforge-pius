import { storage } from "./storage";
import type { InsertQuestion } from "@shared/schema";

const sampleQuestions: InsertQuestion[] = [
  // NCLEX Questions
  {
    category: "NCLEX",
    question: "A nurse is caring for a client who has been prescribed morphine sulfate for pain management. Which of the following assessments is the priority before administering the medication?",
    options: [
      "Check the client's blood pressure",
      "Assess the client's respiratory rate",
      "Evaluate the client's pain level",
      "Review the client's allergy history"
    ],
    correctAnswer: "Assess the client's respiratory rate",
    explanation: "Respiratory rate is the priority assessment because morphine can cause respiratory depression, which is life-threatening. While other assessments are important, maintaining adequate respiratory function is critical for patient safety.",
    difficulty: "medium",
    subject: "Pharmacology"
  },
  {
    category: "NCLEX",
    question: "Which lab value should be monitored for a patient on warfarin therapy?",
    options: [
      "Hemoglobin level",
      "INR (International Normalized Ratio)",
      "Serum creatinine",
      "Blood glucose"
    ],
    correctAnswer: "INR (International Normalized Ratio)",
    explanation: "INR (International Normalized Ratio) is monitored to assess the effectiveness of warfarin therapy and prevent bleeding complications. The therapeutic range for most indications is 2.0-3.0.",
    difficulty: "easy",
    subject: "Pharmacology"
  },
  {
    category: "NCLEX",
    question: "A patient with heart failure is taking furosemide (Lasix). Which of the following should the nurse monitor?",
    options: [
      "Calcium levels",
      "Potassium levels",
      "Sodium intake only",
      "Protein levels"
    ],
    correctAnswer: "Potassium levels",
    explanation: "Furosemide is a loop diuretic that can cause potassium depletion (hypokalemia). Monitoring potassium levels is essential to prevent cardiac arrhythmias and other complications associated with low potassium.",
    difficulty: "medium",
    subject: "Pharmacology"
  },
  
  // TEAS Questions
  {
    category: "TEAS",
    question: "What is the function of mitochondria in a cell?",
    options: [
      "Protein synthesis",
      "Energy production (ATP)",
      "DNA replication",
      "Waste removal"
    ],
    correctAnswer: "Energy production (ATP)",
    explanation: "Mitochondria are known as the 'powerhouse of the cell' because they produce ATP (adenosine triphosphate), which is the main energy currency of cells.",
    difficulty: "easy",
    subject: "Science"
  },
  {
    category: "TEAS",
    question: "Which of the following is the correct order of the phases of mitosis?",
    options: [
      "Prophase, Metaphase, Anaphase, Telophase",
      "Metaphase, Prophase, Telophase, Anaphase",
      "Prophase, Anaphase, Metaphase, Telophase",
      "Telophase, Anaphase, Metaphase, Prophase"
    ],
    correctAnswer: "Prophase, Metaphase, Anaphase, Telophase",
    explanation: "The correct order of mitosis phases is Prophase, Metaphase, Anaphase, Telophase (PMAT). This can be remembered with the mnemonic 'Please Make Another Tea'.",
    difficulty: "medium",
    subject: "Science"
  },
  
  // HESI Questions
  {
    category: "HESI",
    question: "If a patient needs to take 0.5 grams of a medication and the tablets are 250 mg each, how many tablets should the patient take?",
    options: [
      "1 tablet",
      "2 tablets",
      "3 tablets",
      "4 tablets"
    ],
    correctAnswer: "2 tablets",
    explanation: "Convert 0.5 grams to milligrams: 0.5 g × 1000 = 500 mg. Since each tablet is 250 mg, divide 500 mg by 250 mg = 2 tablets.",
    difficulty: "easy",
    subject: "Mathematics"
  },
];

export async function seedQuestions() {
  try {
    console.log("Seeding sample questions...");
    const created = await storage.createQuestions(sampleQuestions);
    console.log(`✓ Created ${created.length} sample questions`);
    return created;
  } catch (error) {
    console.error("Error seeding questions:", error);
    throw error;
  }
}

// Run seeding
seedQuestions()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
