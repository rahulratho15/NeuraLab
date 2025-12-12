import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Course, LabState, LabType, LessonContent } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_SMART = 'gemini-2.5-flash'; 

const cleanJson = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
};

export const generateCourse = async (topic: string): Promise<Course> => {
  const prompt = `
    You are an expert curriculum designer. Create a structured learning path for the topic: "${topic}".
    The course should be broken down into 4-6 distinct modules.
    Assign a specific Lab Type to each module based on what fits best:
    - TERMINAL: for sysadmin, linux, sql, hacking, git
    - CODE_EDITOR: for programming (Java, Python, JS), algorithms
    - VISUALIZER: for abstract concepts, anatomy, graphs, data structures, kubernetes clusters
    - QUIZ: for theoretical knowledge
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      topic: { type: Type.STRING },
      overview: { type: Type.STRING },
      modules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedTime: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
            labType: { type: Type.STRING, enum: ['TERMINAL', 'CODE_EDITOR', 'VISUALIZER', 'QUIZ'] },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['id', 'title', 'description', 'estimatedTime', 'difficulty', 'labType', 'topics']
        }
      }
    },
    required: ['id', 'topic', 'overview', 'modules']
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    
    return JSON.parse(response.text || "{}") as Course;
  } catch (error) {
    console.error("Course generation failed", error);
    throw new Error("Failed to generate course content.");
  }
};

export const generateLesson = async (moduleTitle: string, topic: string): Promise<LessonContent> => {
  // Lesson structure is complex (polymorphic activities), so we stick to strict prompt engineering + cleanup
  const prompt = `
    Create a deep, comprehensive interactive lesson for "${moduleTitle}" in the course "${topic}".
    Break the lesson into 2-3 seamless sections.
    
    CRITICAL: You MUST include a distinct interactive activity in EACH section.
    Vary the activity types. Do NOT just use QUIZ. You MUST use at least one MEMORY, SORTING, or MATCHING game in the lesson.

    Activity Types & Schemas:
    1. "QUIZ": Multiple choice.
       Fields: { "type": "QUIZ", "title": "Knowledge Check", "question": "...", "options": ["A","B"], "correctAnswer": 0, "explanation": "..." }
       
    2. "MEMORY": Card flip game for matching terms to definitions.
       Fields: { "type": "MEMORY", "title": "Term Flip", "pairs": [{"front": "Term", "back": "Def"}], "explanation": "..." }
       
    3. "SORTING": Order steps of a process (e.g. CI/CD pipeline, compilation steps, history).
       Fields: { "type": "SORTING", "title": "Order the Steps", "steps": ["Step 1", "Step 2", "Step 3"], "explanation": "Correct order is..." }
       
    4. "MATCHING": Match concept A to concept B.
       Fields: { "type": "MATCHING", "title": "Concept Match", "matchPairs": [{"term": "A", "definition": "B"}], "explanation": "..." }

    Return strict JSON (no comments, no trailing commas). Structure:
    {
      "title": "${moduleTitle}",
      "sections": [
        {
          "id": "s1",
          "title": "Concept Header",
          "content": "Markdown explanation...",
          "imageUrl": "https://placehold.co/800x400/2563eb/FFF?text=Topic",
          "videoSearchTerm": "Topic tutorial", 
          "visualData": null, 
          "activity": { ... one of the above activity objects ... }
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const text = response.text || "{}";
    return JSON.parse(cleanJson(text)) as LessonContent;
  } catch (error) {
    console.error("Lesson generation failed", error);
    throw new Error("Failed to generate lesson.");
  }
};

export const generateLab = async (moduleTitle: string, topic: string, labType: LabType): Promise<LabState> => {
  const prompt = `
    Design an advanced hands-on lab simulation for "${moduleTitle}" (Topic: "${topic}").
    Lab Type: ${labType}.
    Requirements:
    1. SCENARIO: Real World Scenario.
    2. INSTRUCTION: Step-by-step problem description. 
    3. GOAL: Acceptance criteria.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      moduleId: { type: Type.STRING },
      title: { type: Type.STRING },
      scenario: { type: Type.STRING },
      instruction: { type: Type.STRING },
      goal: { type: Type.STRING },
      initialCode: { type: Type.STRING },
      language: { type: Type.STRING },
      hints: { type: Type.ARRAY, items: { type: Type.STRING } },
      labType: { type: Type.STRING },
      visualData: { 
        type: Type.OBJECT,
        properties: {
           nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type:Type.STRING}, label: {type:Type.STRING} } } },
           links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: {type:Type.STRING}, target: {type:Type.STRING} } } }
        },
        nullable: true
      }
    },
    required: ['id', 'title', 'scenario', 'instruction', 'goal', 'labType', 'hints']
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return JSON.parse(response.text || "{}") as LabState;
  } catch (error) {
    console.error("Lab generation failed", error);
    throw new Error("Failed to generate lab.");
  }
};

export const generatePracticeLab = async (request: string): Promise<LabState> => {
  const prompt = `
    Design a standalone hands-on practice lab for: "${request}".
    Determine the best labType (TERMINAL, CODE_EDITOR, or VISUALIZER).
  `;

  // Reuse schema from generateLab roughly, or define specific one
  const schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      moduleId: { type: Type.STRING },
      title: { type: Type.STRING },
      scenario: { type: Type.STRING },
      instruction: { type: Type.STRING },
      goal: { type: Type.STRING },
      initialCode: { type: Type.STRING },
      language: { type: Type.STRING },
      hints: { type: Type.ARRAY, items: { type: Type.STRING } },
      labType: { type: Type.STRING, enum: ['TERMINAL', 'CODE_EDITOR', 'VISUALIZER'] },
      visualData: { type: Type.OBJECT, nullable: true, properties: { nodes: {type:Type.ARRAY, items: {type:Type.OBJECT}}, links: {type:Type.ARRAY, items: {type:Type.OBJECT}} } }
    },
    required: ['id', 'title', 'scenario', 'instruction', 'goal', 'labType']
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return JSON.parse(response.text || "{}") as LabState;
  } catch (error) {
    console.error("Practice Lab generation failed", error);
    throw new Error("Failed to generate practice lab.");
  }
};

export const evaluateLabAction = async (
  labContext: LabState,
  userAction: string, // Command, Code, or Chat
  history: string
): Promise<{ success: boolean; output: string; feedback: string; isComplete: boolean }> => {
  
  const prompt = `
    ACT AS A STRICT COMPILER AND RUNTIME ENVIRONMENT.
    
    Context:
    - Lab Type: ${labContext.labType}
    - Language: ${labContext.language || 'generic'}
    - Goal: ${labContext.goal}
    
    Input Code/Command: 
    """
    ${userAction}
    """

    Rules for Evaluation:
    1. STRICTLY simulate the output. 
    2. IGNORE ALL COMMENTS.
    3. If the user only provides comments, "success" is false.
    4. Feedback should be extremely concise (max 2 lines).
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
        success: { type: Type.BOOLEAN },
        output: { type: Type.STRING },
        feedback: { type: Type.STRING },
        isComplete: { type: Type.BOOLEAN }
    },
    required: ['success', 'output', 'feedback', 'isComplete']
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: { 
          responseMimeType: "application/json",
          responseSchema: schema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { success: false, output: "System Error: Simulation timed out.", feedback: "Try simpler code.", isComplete: false };
  }
};

export const chatWithTutor = async (
  currentTopic: string,
  history: { role: string; content: string }[],
  message: string
): Promise<string> => {
  const prompt = `
    You are Socratic AI, a helpful tutor for the topic "${currentTopic}".
    Don't just give answers. Guide the user with questions. Be concise.
  `;
  
  const chatInput = [
    { role: 'user', parts: [{ text: `System: ${prompt}` }] },
    ...history.map(h => ({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: h.content }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
     const response = await ai.models.generateContent({
      model: MODEL_FAST,
      // @ts-ignore
      contents: chatInput, 
    });
    return response.text || "I'm having trouble thinking right now.";
  } catch (e) {
    return "Connection error.";
  }
};