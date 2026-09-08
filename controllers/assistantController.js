import { GoogleGenAI } from "@google/genai";
import Medicine from "../models/Medicine.js";

// Flash is the fast/free-tier-eligible model, which fits a short structured
// explanation that may get requested often. See
// https://ai.google.dev/gemini-api/docs/pricing for current tier details.
const MODEL = "gemini-3.6-flash";

const SYSTEM_PROMPT = `You are a medicine information assistant inside the QikMeds pharmacy app.
Using ONLY the medicine data given to you in the user message, explain the medicine to a general audience.

Return 4-6 short bullet strings, in this order: what it's typically used for, how it's typically taken, common side effects, and when to consult a doctor.
Keep each string under 20 words.

Do not invent facts that aren't implied by the provided data. Do not give personalized dosing advice, do not diagnose symptoms,
and do not tell the reader whether they specifically should take it - that judgment belongs to a pharmacist or doctor.`;

// Constrains the model to return exactly the shape we render - an array of
// short strings - instead of us hoping it follows instructions in prose.
const explanationSchema = {
  type: "array",
  items: { type: "string" },
  minItems: 4,
  maxItems: 6,
};

// Best-effort fallback on the rare chance the response isn't valid JSON:
// split on newlines and strip common bullet/number prefixes.
const parseFallback = (raw) =>
  raw
    .split("\n")
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);

// Ceiling on the Gemini call itself, kept well under the frontend's timeout
// for this endpoint (45s - see MedicineAIExplain.jsx) so WE control the
// failure with a clean, fast 504 instead of the client giving up while the
// call is left running into the void server-side.
const AI_TIMEOUT_MS = 20000;

export const explainMedicine = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(503)
        .json({ message: "AI assistant is not configured on this server." });
    }

    // Initialize SDK inside the call with the validated key
    const ai = new GoogleGenAI({ apiKey });

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // Cache hit
    if (medicine.aiExplanation && medicine.aiExplanation.length > 0) {
      return res.json({ points: medicine.aiExplanation, cached: true });
    }

    const { name, description, dosage, manufacturer, category } = medicine;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let response;
    try {
      // models.generateContent is the stateless, single-turn call - a
      // better fit than interactions.create (built for multi-turn,
      // tool-orchestrating, long-running sessions) for a one-shot lookup
      // like this. It also takes abortSignal directly, which is what
      // gives us the timeout below.
      response = await ai.models.generateContent({
        model: MODEL,
        contents: JSON.stringify({
          name,
          description,
          dosage,
          manufacturer,
          category,
        }),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: explanationSchema,
          // 'HIGH' is the Gemini 3 default; LOW keeps a lookup this small fast.
          thinkingConfig: { thinkingLevel: "LOW" },
          abortSignal: controller.signal,
        },
      });
    } finally {
      clearTimeout(timer);
    }

    const raw = response.text || "[]";

    let points;
    try {
      points = JSON.parse(raw);
      if (!Array.isArray(points)) throw new Error("not an array");
    } catch {
      points = parseFallback(raw);
    }

    medicine.aiExplanation = points;
    await medicine.save();

    res.json({ points, cached: false });
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(
        `AI explain timed out after ${AI_TIMEOUT_MS}ms for medicine ${req.params.id}`
      );
      return res.status(504).json({
        message:
          "The AI assistant is taking too long to respond. Please try again in a moment.",
      });
    }
    console.error("AI explain error:", error.message);
    res
      .status(500)
      .json({ message: "Couldn't generate an explanation right now." });
  }
};
