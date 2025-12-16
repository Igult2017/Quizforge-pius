// gemini.ts - Question generation using Google Gemini AI
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InsertQuestion } from "@shared/schema";
import { insertQuestionSchema } from "@shared/schema";

let genAI: GoogleGenerativeAI | null = null;
let detectedModel: string | null = null;

// Initialize Gemini AI safely
function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY environment variable is not set. Please add your Gemini API key."
      );
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Common Gemini models in order of preference
const FALLBACK_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro'
];

// Try to generate with a specific model to test if it works
async function testModel(client: GoogleGenerativeAI, modelName: string): Promise<boolean> {
  try {
    const model = client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 40,
        maxOutputTokens: 100, // Small token limit for test
      },
    });
    
    // Simple test prompt
    const result = await model.generateContent("Say 'OK' if you can generate content.");
    const response = result.response.text();
    
    return response.length > 0;
  } catch (error: any) {
    // If we get a 404, the model doesn't exist
    if (error.status === 404) {
      return false;
    }
    // Other errors might be temporary, so we'll consider the model valid
    console.warn(`⚠️  Warning testing model ${modelName}: ${error.message}`);
    return true;
  }
}

// Get the model name to use (from env var or auto-detect with fallback)
async function getModelName(): Promise<string> {
  // If model is specified in environment, use it (no fallback)
  if (process.env.GEMINI_MODEL) {
    console.log(`📌 Using Gemini model from environment: ${process.env.GEMINI_MODEL}`);
    return process.env.GEMINI_MODEL;
  }

  // If we've already detected a working model, use it
  if (detectedModel) {
    return detectedModel;
  }

  // Try models in order until we find one that works
  const client = getGeminiClient();
  console.log(`🔍 Auto-detecting working Gemini model...`);
  
  for (const modelName of FALLBACK_MODELS) {
    console.log(`   Testing: ${modelName}...`);
    const works = await testModel(client, modelName);
    
    if (works) {
      detectedModel = modelName;
      console.log(`✓ Found working model: ${detectedModel}`);
      return detectedModel;
    } else {
      console.log(`   ✗ Model ${modelName} not available (404)`);
    }
  }

  // If no models work, throw error with helpful message
  throw new Error(
    `No working Gemini models found. Tried: ${FALLBACK_MODELS.join(', ')}. ` +
    `Set GEMINI_MODEL environment variable to a model supported by your API key.`
  );
}

interface GenerateQuestionsParams {
  category: "NCLEX" | "TEAS" | "HESI";
  count: number;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
  sampleQuestion: string; // Sample question for style/format guidance (required)
  areasTocover: string; // Specific areas/subtopics to cover (required)
}

function getExamDescription(category: string): { name: string; description: string } {
  const exams: Record<string, { name: string; description: string }> = {
    NCLEX: {
      name: "NCLEX (National Council Licensure Examination)",
      description: "nursing licensure exam covering patient care, safety, health promotion, and clinical nursing practice"
    },
    TEAS: {
      name: "ATI TEAS (Test of Essential Academic Skills)",
      description: "academic skills assessment covering Reading, Mathematics, Science, and English Language Usage - this is NOT a health-focused exam but an academic aptitude test"
    },
    HESI: {
      name: "HESI A2 (Health Education Systems Admission Assessment)",
      description: "health sciences admission exam covering academic subjects and basic health sciences"
    }
  };
  return exams[category] || exams.NCLEX;
}

function getSubjectContext(category: string, subject?: string): { expertise: string; focus: string; terminology: string; mathExplanationRules?: string } {
  const subjectLower = (subject || "").toLowerCase();
  const categoryUpper = (category || "").toUpperCase();
  
  // =====================
  // MATH SUBJECTS (all exams)
  // =====================
  if (subjectLower.includes("math") || subjectLower.includes("algebra") || 
      subjectLower.includes("arithmetic") || subjectLower.includes("geometry") ||
      subjectLower.includes("calculus") || subjectLower.includes("statistics") ||
      subjectLower.includes("numeracy")) {
    return {
      expertise: "mathematics educator and standardized test question writer",
      focus: "mathematical problem-solving, algebraic reasoning, numerical computation, and quantitative analysis",
      terminology: "Use proper mathematical notation. For fractions use a/b format, for exponents use ^ (e.g., x^2), for square roots use sqrt(), and for other mathematical symbols describe them clearly. CRITICAL: Generate ONLY math questions - no grammar, reading passages, or nursing/health content.",
      mathExplanationRules: `MATH EXPLANATION REQUIREMENTS - CRITICAL:
Every math question explanation MUST include ALL of the following:
1. STATE THE FORMULA: Write out the exact formula or mathematical concept being applied (e.g., "Area of a circle = pi * r^2" or "To convert fractions to decimals, divide numerator by denominator")
2. SHOW THE CALCULATION: Demonstrate the actual step-by-step arithmetic with real numbers from the problem:
   - Step 1: [substitute values into formula]
   - Step 2: [perform operation]
   - Step 3: [simplify to get answer]
3. EXPLAIN THE CONCEPT: Briefly explain WHY this formula/method works and when to use it
4. EXPLAIN WRONG ANSWERS: For each incorrect option, explain the specific mathematical error that would lead to that answer (e.g., "Option B (24) results from forgetting to square the radius" or "Option C comes from adding instead of multiplying")

Example of a GOOD math explanation:
"To find the area of a circle with radius 5, we use the formula: Area = pi * r^2. Substituting: Area = 3.14159 * 5^2 = 3.14159 * 25 = 78.54. The area is approximately 78.5 square units. Option A (31.4) incorrectly uses the circumference formula (2 * pi * r). Option C (25) forgot to multiply by pi. Option D (157) incorrectly used diameter instead of radius."`
    };
  }
  
  // =====================
  // READING/COMPREHENSION SUBJECTS (all exams)
  // =====================
  if (subjectLower.includes("reading") || subjectLower.includes("comprehension") ||
      subjectLower.includes("passage") || subjectLower.includes("literature")) {
    return {
      expertise: "reading and literacy assessment specialist",
      focus: "reading comprehension, textual analysis, inference making, and critical reading skills",
      terminology: "Use clear, academic language. Include varied passage types and question formats that test different reading skills. CRITICAL: DO NOT include any math calculations, formulas, equations, or numerical problem-solving. This is READING only - focus on passages, vocabulary in context, main ideas, inferences, and author's purpose. NO nursing/clinical content unless specifically in the passage."
    };
  }
  
  // =====================
  // ENGLISH/GRAMMAR SUBJECTS (all exams)
  // =====================
  if (subjectLower.includes("english") || subjectLower.includes("grammar") ||
      subjectLower.includes("language") || subjectLower.includes("writing") ||
      subjectLower.includes("vocabulary") || subjectLower.includes("spelling") ||
      subjectLower.includes("punctuation")) {
    return {
      expertise: "English language arts and grammar specialist",
      focus: "grammar rules, sentence structure, vocabulary usage, punctuation, and language conventions",
      terminology: "Use proper grammatical terminology and provide clear examples of correct and incorrect usage. CRITICAL: DO NOT include any math calculations, formulas, equations, or numerical problem-solving. This is ENGLISH/GRAMMAR only - focus on parts of speech, sentence structure, punctuation, spelling, vocabulary, and writing conventions. NO nursing/clinical/health content."
    };
  }
  
  // =====================
  // SCIENCE SUBJECTS (TEAS/HESI academic science)
  // =====================
  if ((categoryUpper === "TEAS" || categoryUpper === "HESI") && 
      (subjectLower.includes("science") || subjectLower.includes("biology") ||
       subjectLower.includes("chemistry") || subjectLower.includes("physics") ||
       subjectLower.includes("anatomy") || subjectLower.includes("physiology"))) {
    return {
      expertise: "science educator and assessment specialist",
      focus: "scientific concepts, laboratory procedures, biological systems, chemical processes, and scientific reasoning",
      terminology: "Use proper scientific terminology and notation. Focus on academic science concepts appropriate for pre-nursing students. CRITICAL: DO NOT include grammar questions, reading comprehension passages, or pure math problems. Science questions may involve some calculations but should focus primarily on conceptual understanding."
    };
  }
  
  // =====================
  // NCLEX NURSING SUBJECTS
  // =====================
  if (categoryUpper === "NCLEX") {
    // Management of Care
    if (subjectLower.includes("management") || subjectLower.includes("care environment") ||
        subjectLower.includes("delegation") || subjectLower.includes("prioritization") ||
        subjectLower.includes("leadership") || subjectLower.includes("advocacy") ||
        subjectLower.includes("advance directive") || subjectLower.includes("legal") ||
        subjectLower.includes("ethical") || subjectLower.includes("informed consent")) {
      return {
        expertise: "registered nurse educator specializing in nursing management and leadership",
        focus: "nursing management, delegation, prioritization, client advocacy, legal/ethical issues, advance directives, informed consent, and care coordination",
        terminology: "Use proper nursing terminology. Focus on clinical decision-making, delegation principles, and nursing leadership. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages. Questions should be clinical nursing scenarios."
      };
    }
    
    // Safety and Infection Control
    if (subjectLower.includes("safety") || subjectLower.includes("infection") ||
        subjectLower.includes("aseptic") || subjectLower.includes("isolation") ||
        subjectLower.includes("standard precaution") || subjectLower.includes("error prevention")) {
      return {
        expertise: "registered nurse educator specializing in patient safety and infection control",
        focus: "patient safety, infection control, standard precautions, isolation techniques, error prevention, and safe medication administration",
        terminology: "Use proper nursing and infection control terminology. Focus on clinical safety scenarios and infection prevention. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
    
    // Pharmacology
    if (subjectLower.includes("pharmacol") || subjectLower.includes("medication") ||
        subjectLower.includes("drug") || subjectLower.includes("dosage")) {
      return {
        expertise: "registered nurse educator specializing in pharmacology and medication administration",
        focus: "medication actions, side effects, nursing implications, drug interactions, patient education, and safe medication administration",
        terminology: "Use proper pharmacological terminology. Include drug classifications, mechanisms of action, and nursing considerations. Dosage calculations may be included but focus on clinical application."
      };
    }
    
    // Medical-Surgical Nursing
    if (subjectLower.includes("medical") || subjectLower.includes("surgical") ||
        subjectLower.includes("med-surg") || subjectLower.includes("adult health")) {
      return {
        expertise: "registered nurse educator specializing in medical-surgical nursing",
        focus: "adult health conditions, surgical care, disease processes, nursing interventions, and patient assessment",
        terminology: "Use proper medical-surgical nursing terminology. Focus on clinical scenarios involving adult patients with acute and chronic conditions. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
    
    // Pediatrics
    if (subjectLower.includes("pediatric") || subjectLower.includes("child") ||
        subjectLower.includes("infant") || subjectLower.includes("adolescent") ||
        subjectLower.includes("newborn") || subjectLower.includes("neonatal")) {
      return {
        expertise: "registered nurse educator specializing in pediatric nursing",
        focus: "pediatric health conditions, growth and development, family-centered care, and age-appropriate nursing interventions",
        terminology: "Use proper pediatric nursing terminology. Focus on clinical scenarios involving infants, children, and adolescents. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
    
    // Obstetrics/Maternity
    if (subjectLower.includes("obstetric") || subjectLower.includes("maternity") ||
        subjectLower.includes("pregnancy") || subjectLower.includes("labor") ||
        subjectLower.includes("postpartum") || subjectLower.includes("antepartum") ||
        subjectLower.includes("prenatal")) {
      return {
        expertise: "registered nurse educator specializing in obstetric and maternity nursing",
        focus: "pregnancy, labor and delivery, postpartum care, newborn care, and women's health",
        terminology: "Use proper obstetric nursing terminology. Focus on clinical scenarios involving pregnant women, laboring patients, and postpartum care. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
    
    // Mental Health/Psychiatric
    if (subjectLower.includes("mental health") || subjectLower.includes("psych") ||
        subjectLower.includes("behavioral") || subjectLower.includes("therapeutic communication")) {
      return {
        expertise: "registered nurse educator specializing in psychiatric and mental health nursing",
        focus: "mental health conditions, therapeutic communication, crisis intervention, and psychiatric nursing interventions",
        terminology: "Use proper psychiatric nursing terminology. Focus on clinical scenarios involving mental health conditions and therapeutic interventions. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
    
    // Physiological Integrity (general)
    if (subjectLower.includes("physiological") || subjectLower.includes("basic care") ||
        subjectLower.includes("comfort") || subjectLower.includes("reduction of risk") ||
        subjectLower.includes("physiological adaptation")) {
      return {
        expertise: "registered nurse educator specializing in physiological nursing care",
        focus: "basic care and comfort, physiological adaptation, risk reduction, and nursing interventions for physiological needs",
        terminology: "Use proper nursing terminology. Focus on clinical scenarios involving patient physiological needs and nursing care. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
    
    // Health Promotion
    if (subjectLower.includes("health promotion") || subjectLower.includes("prevention") ||
        subjectLower.includes("wellness") || subjectLower.includes("screening") ||
        subjectLower.includes("immunization") || subjectLower.includes("lifestyle")) {
      return {
        expertise: "registered nurse educator specializing in health promotion and disease prevention",
        focus: "health promotion, disease prevention, wellness education, screenings, and lifestyle modifications",
        terminology: "Use proper nursing terminology. Focus on patient education and health promotion activities. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
    
    // Psychosocial Integrity
    if (subjectLower.includes("psychosocial") || subjectLower.includes("coping") ||
        subjectLower.includes("grief") || subjectLower.includes("cultural") ||
        subjectLower.includes("spiritual") || subjectLower.includes("family dynamics")) {
      return {
        expertise: "registered nurse educator specializing in psychosocial nursing care",
        focus: "psychosocial support, coping mechanisms, grief and loss, cultural considerations, and family dynamics",
        terminology: "Use proper nursing terminology. Focus on clinical scenarios involving patient psychosocial needs. CRITICAL: DO NOT include pure math problems, grammar questions, or reading comprehension passages."
      };
    }
  }
  
  // =====================
  // HESI SPECIFIC SUBJECTS
  // =====================
  if (categoryUpper === "HESI") {
    // HESI A&P
    if (subjectLower.includes("anatomy") || subjectLower.includes("physiology") ||
        subjectLower.includes("a&p") || subjectLower.includes("body system")) {
      return {
        expertise: "anatomy and physiology educator for health sciences",
        focus: "human body systems, anatomical structures, physiological processes, and their clinical relevance",
        terminology: "Use proper anatomical and physiological terminology. Focus on structure-function relationships. CRITICAL: DO NOT include grammar questions, reading passages, or pure math problems."
      };
    }
    
    // HESI Biology
    if (subjectLower.includes("biology") || subjectLower.includes("cell") ||
        subjectLower.includes("genetics") || subjectLower.includes("microbiology")) {
      return {
        expertise: "biology educator for health sciences admissions",
        focus: "cellular biology, genetics, microbiology, and biological processes relevant to health sciences",
        terminology: "Use proper biological terminology. CRITICAL: DO NOT include grammar questions, reading passages, or pure math problems."
      };
    }
    
    // HESI Chemistry
    if (subjectLower.includes("chemistry") || subjectLower.includes("chemical") ||
        subjectLower.includes("organic") || subjectLower.includes("biochemistry")) {
      return {
        expertise: "chemistry educator for health sciences admissions",
        focus: "chemical principles, reactions, organic chemistry basics, and biochemistry relevant to health sciences",
        terminology: "Use proper chemistry terminology and notation. CRITICAL: DO NOT include grammar questions, reading passages, or unrelated math problems."
      };
    }
  }
  
  // =====================
  // GENERAL SCIENCE (fallback)
  // =====================
  if (subjectLower.includes("science") || subjectLower.includes("biology") ||
      subjectLower.includes("chemistry") || subjectLower.includes("physics") ||
      subjectLower.includes("anatomy") || subjectLower.includes("physiology")) {
    return {
      expertise: "science educator and assessment specialist",
      focus: "scientific concepts, laboratory procedures, biological systems, chemical processes, and scientific reasoning",
      terminology: "Use proper scientific terminology and notation. CRITICAL: DO NOT include grammar questions, reading passages, or pure math problems unrelated to science."
    };
  }
  
  // =====================
  // DEFAULT FALLBACK
  // =====================
  return {
    expertise: "professional exam question writer and subject matter expert",
    focus: "critical thinking, practical application, and conceptual understanding specific to the requested subject",
    terminology: "Use appropriate professional and academic terminology for the subject area. CRITICAL: Stay strictly within the specified subject - do NOT mix in content from other subjects like math, grammar, or unrelated topics."
  };
}

export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<InsertQuestion[]> {
  const { category, count, subject, difficulty, sampleQuestion, areasTocover } = params;

  const examInfo = getExamDescription(category);
  const subjectContext = getSubjectContext(category, subject);

  let systemPrompt = `You are an expert ${subjectContext.expertise} with decades of experience creating ${examInfo.name} exam questions. 

EXAM CONTEXT:
${examInfo.name} is a ${examInfo.description}.

SUBJECT FOCUS: ${subject || "General"}
Your questions must focus on: ${subjectContext.focus}

QUALITY REQUIREMENTS:
- Each question must have exactly 4 answer options (A, B, C, D)
- Only ONE option should be correct - the others should be plausible but clearly incorrect
- Include a detailed, educational explanation for why the correct answer is right AND why other options are wrong
- Questions must test critical thinking and problem-solving, not just memorization
- ${subjectContext.terminology}
- Follow official ${category} question format standards
- Avoid trivial or surface-level questions - focus on practical application
${subjectContext.mathExplanationRules ? `\n${subjectContext.mathExplanationRules}` : ''}`;

  // If sample question provided, emphasize matching its quality
  if (sampleQuestion) {
    systemPrompt += `

CRITICAL - MATCH THIS QUALITY STANDARD:
You MUST generate questions that match the quality, style, complexity, and format of this reference question:

"""
${sampleQuestion}
"""

Analyze this sample carefully and ensure your generated questions:
1. Match the same question structure and phrasing style
2. Have similar complexity and depth of clinical reasoning required
3. Use the same level of detail in answer options
4. Provide equally thorough explanations
5. Target the same cognitive level (application/analysis)`;
  }

  systemPrompt += `

CRITICAL JSON FORMATTING RULES:
1. Return ONLY valid JSON - no extra text before or after
2. Use double quotes for all property names and string values
3. If text contains quotes, use ONLY apostrophes (') instead of double quotes (")
4. Keep all text concise to ensure complete response
5. Never truncate or cut off any question object

Return a JSON array with this exact structure:
[
  {
    "question": "The complete question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The exact text of the correct option",
    "explanation": "Detailed explanation of why this answer is correct",
    "subject": "Subject area (e.g., Pharmacology, Medical-Surgical, Management of Care)",
    "topic": "Specific topic/unit within the subject (e.g., Advance Directives, Drug Interactions, Client Rights)",
    "difficulty": "easy|medium|hard"
  }
]`;

  // Detect if single topic or multiple topics
  const topicList = areasTocover.split(/[,;\n]+/).map(t => t.trim()).filter(t => t.length > 0);
  const isSingleTopic = topicList.length === 1;
  
  let userPrompt: string;
  
  if (isSingleTopic) {
    // Single topic mode - all questions focus on this one topic
    const singleTopic = topicList[0];
    userPrompt = `Generate ${count} ${difficulty || "medium"} difficulty ${category} questions on the subject: "${subject || 'General'}".

Each question should test practical knowledge and critical thinking skills relevant to the subject area.

FOCUS TOPIC: "${singleTopic}"
ALL ${count} questions MUST be specifically about this topic. Cover different aspects, scenarios, and applications within this topic.

IMPORTANT FOR EACH QUESTION:
- Set "subject" to the main subject area: "${subject || 'General'}"
- Set "topic" to EXACTLY: "${singleTopic}"
- Every question must have topic set to "${singleTopic}" - do NOT use any other topic name

Generate diverse questions that thoroughly cover different aspects of "${singleTopic}".

Ensure proper formatting with exactly 4 options per question. Each question should be unique and test different aspects of this specific topic.`;
  } else {
    // Multiple topics mode - distribute evenly
    userPrompt = `Generate ${count} ${difficulty || "medium"} difficulty ${category} questions on the subject: "${subject || 'General'}".

Each question should test practical knowledge and critical thinking skills relevant to the subject area.

MANDATORY - COVER THESE SPECIFIC TOPICS/UNITS:
The questions MUST cover the following specific topics, units, or subtopics. Distribute questions evenly across these topics:
${areasTocover}

IMPORTANT FOR EACH QUESTION:
- Set "subject" to the main subject area: "${subject || 'General'}"
- Set "topic" to the SPECIFIC topic/unit from the list above that the question addresses (e.g., "Advance Directives", "Drug Interactions", "Algebraic Equations")
- Each question must have a specific topic assigned - do NOT leave topic empty

Make sure to generate questions that specifically address these areas rather than general questions on the topic.

Ensure proper formatting with exactly 4 options per question. Each question should be unique and test different aspects of the specified areas.`;
  }

  try {
    const client = getGeminiClient();
    
    // Get the model name (from env var or auto-detect with fallback)
    const modelName = await getModelName();
    
    const model = client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const response = result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No content received from Gemini AI");
    }

    // Strip markdown code fences if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    // Parse JSON with multiple fallback strategies
    let questions;
    try {
      questions = JSON.parse(cleanContent);
    } catch (parseError: any) {
      console.error("❌ Initial JSON parse error:", parseError.message);
      
      // Strategy 1: Clean up common JSON issues
      let fixedContent = cleanContent
        // Remove BOM and invisible characters
        .replace(/^\uFEFF/, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Remove trailing commas before closing brackets/braces
        .replace(/,(\s*[}\]])/g, '$1')
        // Ensure it starts with [ and ends with ]
        .trim();
      
      // Make sure we only have the array part
      const firstBracket = fixedContent.indexOf('[');
      const lastBracket = fixedContent.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        fixedContent = fixedContent.substring(firstBracket, lastBracket + 1);
      }
      
      try {
        console.log("🔧 Attempting parse with basic cleanup (attempt 1)...");
        questions = JSON.parse(fixedContent);
        console.log("✅ Successfully parsed after basic cleanup");
      } catch (secondError: any) {
        // Strategy 2: Try to fix quote issues
        try {
          console.log("🔧 Attempting parse with quote fixing (attempt 2)...");
          
          // Replace escaped single quotes in strings with apostrophes
          let quoteFixed = fixedContent
            .replace(/\\'/g, "'")
            // Fix double-escaped quotes
            .replace(/\\\\"/g, '\\"');
          
          questions = JSON.parse(quoteFixed);
          console.log("✅ Successfully parsed after quote fixing");
        } catch (thirdError: any) {
          // Strategy 3: Extract complete question objects manually
          try {
            console.log("🔧 Attempting manual extraction of complete questions (attempt 3)...");
            
            // Split on question object boundaries and rebuild
            const objectMatches: any[] = [];
            let depth = 0;
            let currentObj = '';
            let inString = false;
            let escapeNext = false;
            
            for (let i = 0; i < cleanContent.length; i++) {
              const char = cleanContent[i];
              
              if (escapeNext) {
                currentObj += char;
                escapeNext = false;
                continue;
              }
              
              if (char === '\\') {
                escapeNext = true;
                currentObj += char;
                continue;
              }
              
              if (char === '"') {
                inString = !inString;
              }
              
              if (!inString) {
                if (char === '{') {
                  if (depth === 0) currentObj = '';
                  depth++;
                }
                if (char === '}') {
                  depth--;
                  if (depth === 0) {
                    currentObj += char;
                    // Try to parse this object
                    try {
                      const obj = JSON.parse(currentObj);
                      if (obj.question && obj.options && obj.correctAnswer && obj.explanation) {
                        objectMatches.push(obj);
                      }
                    } catch (e) {
                      // Skip invalid objects
                    }
                    currentObj = '';
                    continue;
                  }
                }
              }
              
              if (depth > 0) {
                currentObj += char;
              }
            }
            
            if (objectMatches.length > 0) {
              questions = objectMatches;
              console.log(`✅ Manually extracted ${questions.length} valid question objects`);
            } else {
              throw new Error("Could not extract any valid question objects");
            }
          } catch (fourthError: any) {
            // If all strategies fail, provide detailed error info
            console.error("❌ All parsing strategies failed");
            console.error("\nOriginal error:", parseError.message);
            console.error("\nFirst 300 chars:", cleanContent.substring(0, 300));
            console.error("\nLast 300 chars:", cleanContent.substring(Math.max(0, cleanContent.length - 300)));
            throw new Error(`Invalid JSON response from Gemini AI after all cleanup attempts: ${parseError.message}`);
          }
        }
      }
    }

    if (!Array.isArray(questions)) {
      throw new Error("Gemini AI response is not an array of questions");
    }

    // Validate and transform to InsertQuestion format
    const validatedQuestions: InsertQuestion[] = [];
    for (const q of questions) {
      try {
        const validated = insertQuestionSchema.parse({
          category,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || difficulty || "medium",
          subject: subject, // Always use admin-specified subject, not Gemini's override
          topic: q.topic || null, // Store the specific topic/unit
        });
        validatedQuestions.push(validated);
      } catch (validationError: any) {
        console.error("Question validation failed:", validationError);
      }
    }

    if (validatedQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }

    return validatedQuestions;
  } catch (error: any) {
    console.error("Error generating questions with Gemini AI:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
}
