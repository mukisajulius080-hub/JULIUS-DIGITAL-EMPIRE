
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
console.log("Gemini key loaded:", Boolean(apiKey));
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
  growth: "Give practical business growth advice.",

  cv: "Create professional CVs, resumes and job applications.",
  advertising: "Write persuasive advertisements and promotional messages.",
  social: "Generate social media captions, content calendars and post ideas.",
  proposal: "Write professional project proposals with objectives, budgets and implementation plans.",
  music: "Help develop original song ideas, lyrics, songwriting exercises and music learning resources."
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
You are JULIUS DIGITAL EMPIRE AI ASSISTANT.

SPECIALITY:
${tools[tool]}

USER REQUEST:
${details}

GENERAL INSTRUCTIONS:
1. Understand the selected tool and answer according to its speciality.
2. Give professional, practical and useful results.
3. Use clear headings and organized sections.
4. Use simple language that users can understand.
5. Consider Uganda and East African users where relevant.
6. Use UGX for financial estimates where appropriate.
7. Never invent personal information, qualifications or facts.
8. Ask for missing essential information when necessary.
9. Make outputs ready for users to edit and use.
10. Provide realistic recommendations and actionable steps.

Respond professionally as JULIUS DIGITAL EMPIRE.
`;
const modelUrl =
 "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
let response;
let data;

for (let attempt = 1; attempt <= 3; attempt++) {
  response = await fetch(modelUrl, {
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
  });

  data = await response.json();

  if (response.ok || (response.status !== 503 && response.status !== 429)) {
    break;
  }

  if (attempt < 3) {
    await new Promise(resolve =>
      setTimeout(resolve, attempt * 2000)
    );
  }
}

    
if (!response.ok) {
  console.error("Gemini API error:", response.status);
  console.error("Gemini API details:", JSON.stringify(data));
  console.log("Trying OpenAI backup...");

  const openAiKey = process.env.OPENAI_API_KEY;

  if (!openAiKey) {
    return res.status(503).json({
      error: "OpenAI backup is not configured."
    });
  }

  try {
    const openAiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: "gpt-6-luna",
          input: prompt,
          max_output_tokens: 2048,
          store: false
        }),
        signal: AbortSignal.timeout(60000)
      }
    );

    const openAiData = await openAiResponse.json();

    if (!openAiResponse.ok) {
      console.error("OpenAI API error:", openAiResponse.status);
      console.error("OpenAI API details:", JSON.stringify(openAiData));

      return res.status(502).json({
        error: "Both AI services failed. Please try again."
      });
    }

    const openAiReply = openAiData.output
      ?.filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n")
      .trim();

    if (!openAiReply) {
      return res.status(502).json({
        error: "OpenAI returned an empty response."
      });
    }

    console.log("OpenAI backup responded successfully.");
    return res.json({ reply: openAiReply });

  } catch (error) {
    console.error("OpenAI backup error:", error.message);

    return res.status(502).json({
      error: "Both AI services are unavailable. Please try again."
    });
  }
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
