import { CategoryCard } from "../CategoryCard";
import nclexIcon from "@assets/generated_images/NCLEX_stethoscope_icon_fdac6417.png";

export default function CategoryCardExample() {
  return (
    <div className="p-6 max-w-md">
      <CategoryCard
        title="NCLEX Practice"
        description="Master your RN or PN licensing exam with comprehensive practice questions."
        questionCount="5,000+ RN & PN questions"
        features={[
          "Exam simulations",
          "Detailed explanations",
          "All subject areas"
        ]}
        progress={35}
        color="purple"
        iconSrc={nclexIcon}
        onStart={() => console.log("NCLEX practice started")}
      />
    </div>
  );
}
