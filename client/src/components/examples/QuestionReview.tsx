import { QuestionReview } from "../QuestionReview";

export default function QuestionReviewExample() {
  const mockQuestions = [
    {
      question: "What is the priority assessment before administering morphine?",
      userAnswer: "Assess the client's respiratory rate",
      correctAnswer: "Assess the client's respiratory rate",
      options: [
        "Check the client's blood pressure",
        "Assess the client's respiratory rate",
        "Evaluate the client's pain level",
        "Review the client's allergy history"
      ],
      explanation: "Respiratory rate is the priority assessment because morphine can cause respiratory depression, which is life-threatening."
    },
    {
      question: "Which lab value should be monitored for a patient on warfarin?",
      userAnswer: "Hemoglobin",
      correctAnswer: "INR",
      options: [
        "Hemoglobin",
        "INR",
        "Creatinine",
        "Glucose"
      ],
      explanation: "INR (International Normalized Ratio) is monitored to assess the effectiveness of warfarin therapy and prevent bleeding complications."
    }
  ];

  return (
    <div className="p-6 max-w-3xl">
      <QuestionReview questions={mockQuestions} />
    </div>
  );
}
