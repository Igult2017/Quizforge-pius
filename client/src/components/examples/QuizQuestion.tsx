import { useState } from "react";
import { QuizQuestion } from "../QuizQuestion";

export default function QuizQuestionExample() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-3xl">
      <QuizQuestion
        questionNumber={1}
        totalQuestions={50}
        question="A nurse is caring for a client who has been prescribed morphine sulfate for pain management. Which of the following assessments is the priority before administering the medication?"
        options={[
          "Check the client's blood pressure",
          "Assess the client's respiratory rate",
          "Evaluate the client's pain level",
          "Review the client's allergy history"
        ]}
        selectedAnswer={selectedAnswer}
        onAnswerSelect={(answer) => {
          setSelectedAnswer(answer);
          console.log("Selected answer:", answer);
        }}
      />
    </div>
  );
}
