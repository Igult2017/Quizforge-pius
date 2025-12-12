import jsPDF from "jspdf";

interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  difficulty: string | null;
  subject: string | null;
}

interface PDFOptions {
  title: string;
  category: string;
  subject?: string;
  includeAnswers: boolean;
}

export function generateQuestionsPDF(questions: Question[], options: PDFOptions): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  const addHeader = () => {
    doc.setFillColor(20, 80, 120);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("NurseBrace", margin, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Nursing Exam Practice Platform", margin, 33);
    
    doc.setFontSize(12);
    doc.text(options.category, pageWidth - margin, 25, { align: "right" });
    if (options.subject) {
      doc.setFontSize(10);
      doc.text(options.subject, pageWidth - margin, 33, { align: "right" });
    }
    
    yPos = 55;
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 25, pageWidth, 25, "F");
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    
    const legalText = "FOR EDUCATIONAL USE ONLY - NOT TO BE REPRODUCED OR DISTRIBUTED";
    doc.text(legalText, pageWidth / 2, pageHeight - 15, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, pageHeight - 8);
  };

  const addNewPage = () => {
    doc.addPage();
    addHeader();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - 35) {
      addNewPage();
      return true;
    }
    return false;
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  addHeader();

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(options.title, margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Questions: ${questions.length}`, margin, yPos);
  yPos += 15;

  questions.forEach((q, index) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const questionLines = wrapText(q.question, contentWidth - 25);
    const optionLines = q.options.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      return wrapText(`${letter}. ${opt}`, contentWidth - 10);
    });
    
    let questionHeight = 20 + (questionLines.length * 5);
    optionLines.forEach(lines => {
      questionHeight += lines.length * 5 + 3;
    });
    
    if (options.includeAnswers && q.explanation) {
      const explLines = wrapText(q.explanation, contentWidth - 10);
      questionHeight += 15 + (explLines.length * 5);
    }
    
    checkPageBreak(questionHeight + 10);

    doc.setFillColor(240, 245, 250);
    doc.roundedRect(margin - 5, yPos - 3, contentWidth + 10, 18, 2, 2, "F");
    
    doc.setTextColor(20, 80, 120);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Question ${index + 1}`, margin, yPos + 8);
    
    if (q.difficulty) {
      const diffColors: Record<string, [number, number, number]> = {
        easy: [34, 139, 34],
        medium: [255, 165, 0],
        hard: [220, 20, 60],
      };
      const color = diffColors[q.difficulty] || [100, 100, 100];
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(9);
      doc.text(q.difficulty.toUpperCase(), pageWidth - margin - 5, yPos + 8, { align: "right" });
    }
    
    yPos += 20;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    questionLines.forEach((line) => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 5;

    q.options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const isCorrect = opt === q.correctAnswer || letter === q.correctAnswer;
      
      if (options.includeAnswers && isCorrect) {
        doc.setTextColor(34, 139, 34);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
      }
      
      const optLines = wrapText(`${letter}. ${opt}`, contentWidth - 10);
      optLines.forEach((line, lineIdx) => {
        doc.text(lineIdx === 0 ? line : `    ${line}`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 2;
    });

    if (options.includeAnswers) {
      yPos += 5;
      doc.setFillColor(230, 245, 230);
      
      let answerText = `Correct Answer: ${q.correctAnswer}`;
      const explanationLines = q.explanation ? wrapText(q.explanation, contentWidth - 15) : [];
      const boxHeight = 20 + (explanationLines.length * 5);
      
      checkPageBreak(boxHeight);
      
      doc.roundedRect(margin, yPos - 3, contentWidth, boxHeight, 2, 2, "F");
      
      doc.setTextColor(34, 139, 34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(answerText, margin + 5, yPos + 5);
      
      if (q.explanation) {
        yPos += 10;
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        explanationLines.forEach((line) => {
          doc.text(line, margin + 5, yPos);
          yPos += 5;
        });
      }
      yPos += 10;
    }
    
    yPos += 10;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  const filename = `NurseBrace_${options.category}${options.subject ? `_${options.subject.replace(/\s+/g, "_")}` : ""}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

export async function generateQuestionsFromAPI(
  category: string,
  topic: string,
  count: number,
  sampleQuestion: string,
  areasTocover: string,
  includeAnswers: boolean,
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  onProgress?.(10, "Generating questions from AI...");
  
  const response = await fetch("/api/admin/generate-for-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category,
      topic,
      count,
      sampleQuestion,
      areasTocover,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate questions");
  }

  onProgress?.(70, "Processing response...");
  const data = await response.json();
  
  if (!data.questions || data.questions.length === 0) {
    throw new Error("No questions were generated");
  }

  onProgress?.(90, "Creating PDF...");
  
  generateQuestionsPDF(data.questions, {
    title: `${topic} Practice Questions`,
    category,
    subject: topic,
    includeAnswers,
  });

  onProgress?.(100, "PDF downloaded!");
}
