import { ServiceCenterModel } from "../../DB/models/ServiceCenter.model.js";
import { TowTruckModel } from "./../../DB/models/TowTruck.model.js";

/**
 * Calls the AI (LLM / Vision) provider and returns a structured diagnosis.
 * Replace the body with your real Anthropic/OpenAI call.
 */
export const analyzeFault = async ({ faultType, faultText, faultImageUrl }) => {
  const prompt = buildPrompt({ faultText });

  // TODO: replace with real API call (Anthropic /v1/messages, vision model, etc.)
  // const response = await fetch("https://api.anthropic.com/v1/messages", {...});
  // const data = await response.json();
  // const parsed = JSON.parse(data.content[0].text);

  // Placeholder structured result (must match aiResult schema)
  const parsed = {
    faultName: "غير محدد",
    difficulty: "medium", // easy | medium | hard
    requiredTools: [],
    steps: [],
    safetyTips: [],
    confidence: 0,
  };

  return parsed;
};

const buildPrompt = ({ faultText }) => {
  return `
You are a car diagnostic assistant. Analyze the following fault description and vehicle info,
and return ONLY a JSON object with this exact shape (no markdown, no preamble):
{
  "faultName": string,
  "difficulty": "easy" | "hard",
  "requiredTools": string[],
  "steps": string[],
  "safetyTips": string[],
  "confidence": number (0-1)
}

Fault description: ${faultText || "N/A (image provided)"}
`.trim();
};

/**
 * Finds the nearest ServiceCenter to a given [lng, lat] point.
 */
export const findNearestServiceCenter = async (coordinates) => {
  const [center] = await ServiceCenterModel.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates },
        distanceField: "distanceMeters",
        spherical: true,
        query: { freezedBy: null },
      },
    },
    { $limit: 1 },
  ]);

  if (!center) return null;

  return {
    refId: center._id,
    name: center.name,
    phone: center.phone,
    distanceKm: +(center.distanceMeters / 1000).toFixed(2),
  };
};

/**
 * Finds the nearest available TowTruck to a given [lng, lat] point.
 */
export const findNearestTowTruck = async (coordinates) => {
  const [truck] = await TowTruckModel.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates },
        distanceField: "distanceMeters",
        spherical: true,
        query: { freezedBy: null, isAvailable: true },
      },
    },
    { $limit: 1 },
  ]);

  if (!truck) return null;

  return {
    refId: truck._id,
    name: truck.name,
    phone: truck.phone,
    distanceKm: +(truck.distanceMeters / 1000).toFixed(2),
  };
};