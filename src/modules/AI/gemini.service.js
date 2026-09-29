const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const ENDPOINT = (model) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;



const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
const RETRYABLE = [429, 500, 503];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class GeminiHttpError extends Error {
    constructor(status, model, body) {
        super(`Gemini ${status} (${model}): ${body}`);
        this.status = status;
    }
}

const callGemini = async (body) => {
    let lastError;

    for (const model of [MODEL, FALLBACK_MODEL]) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await fetch(ENDPOINT(model), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": process.env.GEMINI_API_KEY,
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(60_000),
                });

                if (res.ok) return await res.json();
                throw new GeminiHttpError(res.status, model, await res.text());
            } catch (e) {
                lastError = e;
                if (e.status === 404) break;                              // model gone, try next model
                if (e.status && !RETRYABLE.includes(e.status)) throw e;   // 400/403: retrying won't help
            }
            await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s (also retries network errors)
        }
    }
    throw lastError;
};
const SYSTEM_PROMPT = `You are a car diagnostic assistant.
Respond with ONLY a JSON object with this exact shape:
{
  "faultName": string,
  "difficulty": "easy" | "hard",
  "requiredTools": string[],
  "steps": string[],
  "safetyTips": string[],
  "confidence": number
}
Rules:
- confidence is between 0 and 1.
- Use "hard" if the repair needs a technician or the car is unsafe to drive.
- Write all text values in the same language as the user's input (Arabic input -> Arabic output).
- If the input is not a car problem, return faultName "غير محدد" with confidence 0.`;

const toArray = (v) => (Array.isArray(v) ? v.map(String) : []);

const normalize = (r) => ({
    faultName: String(r.faultName || "غير محدد"),
    difficulty: r.difficulty === "easy" ? "easy" : "hard", // fail safe
    requiredTools: toArray(r.requiredTools),
    steps: toArray(r.steps),
    safetyTips: toArray(r.safetyTips),
    confidence: Math.min(1, Math.max(0, Number(r.confidence) || 0)),
});

const providerError = (original) => {
    console.error("Gemini error:", original);
    const err = new Error("AI service is temporarily unavailable");
    err.statusCode = 503;
    if (process.env.NODE_ENV !== "production") {
        err.details = String(original?.message || original).slice(0, 500);
    }
    return err;
};

// Gemini needs image bytes (base64), not a URL
const urlToInlinePart = async (url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const data = Buffer.from(await res.arrayBuffer()).toString("base64");
    return { inlineData: { mimeType, data } };
};
export const analyzeFault = async ({ faultType, faultText, faultImageUrl }) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    let data; // 👈 must be declared here, outside the try

    try {
        const parts = [];
        if (faultText) parts.push({ text: `Fault description: ${faultText}` });
        if (faultImageUrl) {
            parts.push(await urlToInlinePart(faultImageUrl));
            if (!faultText) parts.push({ text: "Diagnose the problem shown in this image." });
        }

        data = await callGemini({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
        });
    } catch (e) {
        throw providerError(e);
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("");
    try {
        return normalize(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
        console.error("Invalid Gemini output:", JSON.stringify(data)?.slice(0, 500));
        const err = new Error("AI service returned an invalid diagnosis format");
        err.statusCode = 502;
        throw err;
    }
};
// export const analyzeFault = async ({ faultType, faultText, faultImageUrl }) => {
//     if (!process.env.GEMINI_API_KEY) {
//         throw new Error("GEMINI_API_KEY is not set");
//     }

//     // let data;
//     // try {
//     //     const parts = [];
//     //     if (faultText) parts.push({ text: `Fault description: ${faultText}` });
//     //     if (faultImageUrl) {
//     //         parts.push(await urlToInlinePart(faultImageUrl));
//     //         if (!faultText) parts.push({ text: "Diagnose the problem shown in this image." });
//     //     }

//     //     const res = await fetch(ENDPOINT(MODEL), {
//     //         method: "POST",
//     //         headers: {
//     //             "Content-Type": "application/json",
//     //             "x-goog-api-key": process.env.GEMINI_API_KEY,
//     //         },
//     //         body: JSON.stringify({
//     //             systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
//     //             contents: [{ role: "user", parts }],
//     //             generationConfig: {
//     //                 responseMimeType: "application/json",
//     //                 temperature: 0.3,
//     //             },
//     //         }),
//     //         signal: AbortSignal.timeout(60_000),
//     //     });

//     //     if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
//     //     data = await res.json();
//     // } catch (e) {
//     //     throw providerError(e);
//     // }

//     const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("");
//     try {
//         return normalize(JSON.parse(text.replace(/```json|```/g, "").trim()));
//     } catch {
//         console.error("Invalid Gemini output:", JSON.stringify(data)?.slice(0, 500));
//         const err = new Error("AI returned an invalid diagnosis format");
//         err.statusCode = 502;
//         throw err;
//     }
// };