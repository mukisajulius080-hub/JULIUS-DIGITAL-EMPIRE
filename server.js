
const express = require("express");
const path = require("path");

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "15kb" }));

app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    business: "JULIUS DIGITAL EMPIRE"
  });
});

// Basic request protection
const requests = new Map();

function allowed(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const limit = 10;

  let entry = requests.get(ip);

  if (!entry || now - entry.start >= windowMs) {
    requests.set(ip, { start: now, count: 1 });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

// AI Business Assistant
app.post("/api/business-assistant", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "AI service is not configured."
      });
    }

    const tool = req.body.tool;

    const tools = {
      idea: "Generate practical business ideas.",
      plan: "Create a professional business plan.",
      marketing: "Create a marketing and advertising strategy.",
      budget: "Prepare a detailed startup budget and profit estimate.",
      growth: "Give practical business growth advice."
    };

    if (!tools[tool]) {
      return res.status(400).json({
        error: "Invalid business tool selected."
      });
    }

    const ip = req.ip || "unknown";

    if (!allowed(ip)) {
      return res.status(429).json({
        error: "Usage limit reached. Please try again later."
      });
    }

    const details = typeof req.body.details === "string"
      ? req.body.details.trim()
      : JSON.stringify(req.body.details || {});

    if (!details || details.length > 6000) {
      return res.status(400).json({
        error: "Please provide business details (maximum 6000 characters)."
      });
    }

    const prompt = `
You are JULIUS DIGITAL EMPIRE AI BUSINESS ASSISTANT.

Your role is to help entrepreneurs build and grow businesses.

TASK:
${tools[tool]}

USER DETAILS:
${details}

IMPORTANT INSTRUCTIONS:
1. Prioritize Uganda and East African markets.
2. Use Uganda Shillings (UGX) for financial estimates.
3. Give practical, realistic recommendations.
4. Explain startup costs and operating expenses.
5. Show calculations and assumptions clearly.
6. Never guarantee profits or invent market research.
7. Distinguish estimates from verified facts.
8. Use clear headings and organized lists.
9. Consider small businesses and limited starting capital.
10. Give actionable steps the entrepreneur can follow.

Respond professionally and helpfully.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        }),
        signal: AbortSignal.timeout(45000)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status);

      return res.status(
        response.status === 429 ? 429 : 502
      ).json({
        error: response.status === 429
          ? "AI usage quota reached. Please try again later."
          : "The AI service could not complete your request."
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "The AI returned an empty response."
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error("AI Assistant error:", error.message);

    res.status(
      error.name === "TimeoutError" ? 504 : 500
    ).json({
      error: "Something went wrong. Please try again."
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("JULIUS DIGITAL EMPIRE is running");
});
