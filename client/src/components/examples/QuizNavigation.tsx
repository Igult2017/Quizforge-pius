import { QuizNavigation } from "../QuizNavigation";

export default function QuizNavigationExample() {
  return (
    <div className="p-6 max-w-3xl">
      <QuizNavigation
        currentQuestion={15}
        totalQuestions={50}
        answeredCount={14}
        onPrevious={() => console.log("Previous clicked")}
        onNext={() => console.log("Next clicked")}
        onSubmit={() => console.log("Submit clicked")}
        canGoBack={true}
        canGoNext={true}
        isLastQuestion={false}
      />
    </div>
  );
}
