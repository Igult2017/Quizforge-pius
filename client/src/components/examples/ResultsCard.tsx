import { ResultsCard } from "../ResultsCard";

export default function ResultsCardExample() {
  return (
    <div className="p-6 max-w-2xl">
      <ResultsCard
        score={38}
        totalQuestions={50}
        correctAnswers={38}
        incorrectAnswers={10}
        skippedAnswers={2}
      />
    </div>
  );
}
