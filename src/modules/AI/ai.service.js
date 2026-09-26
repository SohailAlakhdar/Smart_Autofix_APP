import { FaultKnowledgeBaseModel } from "../DB/models/FaultKnowledgeBase.model.js";

// ============================================================
// AI SERVICE — isolated per spec section 25/28.
// fault.controller.js / fault.service.js should call ONLY
// diagnoseFault() below. Nothing outside this file should know
// how classification actually happens.
//
// CURRENT STATE: mock keyword-matching classifier (no ML model
// wired up yet, per your confirmation). To swap in a real model
// later — a hosted endpoint, a local Python service, whatever —
// replace the body of classifyFault() only. diagnoseFault() and
// its return shape (faultName/difficulty/tools/steps/safetyTips)
// must stay stable, since that's the REST contract the Flutter
// app and fault.controller.js depend on.
// ============================================================

const FALLBACK_DIAGNOSIS = {
    faultKey: "unknown",
    faultName: "Unrecognized Fault",
    difficulty: "hard",
    tools: [],
    steps: [],
    safetyTips: [
        "Do not continue driving until the vehicle is inspected by a professional.",
    ],
};

// Mock classifier: scores each FaultKnowledgeBase entry by how many of its
// keywords appear in the lowercased faultText, returns the highest-scoring
// entry (or null if nothing scores above 0).
//
// LIMITATION: this only works on text. It cannot classify an image alone —
// there is no way to interpret photo content without a real vision model.
// diagnoseFault() below handles that case explicitly rather than guessing.
const classifyFault = async ({ text }) => {
    if (!text || typeof text !== "string" || !text.trim()) {
        return null;
    }

    const normalizedText = text.toLowerCase();
    const entries = await FaultKnowledgeBaseModel.find({});

    let bestMatch = null;
    let bestScore = 0;

    for (const entry of entries) {
        const score = entry.keywords.reduce(
            (count, keyword) => (normalizedText.includes(keyword) ? count + 1 : count),
            0
        );
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    return bestScore > 0 ? bestMatch : null;
};

// Main entry point. faultType is "text" | "image" | "text_image" per spec
// section 11 — used here to decide whether classification is even possible
// yet, and to leave a clear seam for where an image-capable model plugs in.
//
// Params:
//   text      - faultText from the user, if provided
//   imagePath - Cloudinary secure_url/public_id of the uploaded image, if provided
//   faultType - "text" | "image" | "text_image"
//
// Returns: { faultName, difficulty, tools, steps, safetyTips }
export const diagnoseFault = async ({ text, imagePath, faultType }) => {
    if (faultType === "image") {
        // No text to classify against, and no real vision model yet.
        // TODO: replace with a call to the image classifier once available;
        // it should return a faultKey this function can look up the same
        // way classifyFault() does for text.
        return { ...FALLBACK_DIAGNOSIS };
    }

    // "text" or "text_image" — classify on the text signal.
    const match = await classifyFault({ text });

    if (!match) {
        return { ...FALLBACK_DIAGNOSIS };
    }

    return {
        faultName: match.faultName,
        difficulty: match.difficulty,
        tools: match.tools,
        steps: match.steps,
        safetyTips: match.safetyTips,
    };
};