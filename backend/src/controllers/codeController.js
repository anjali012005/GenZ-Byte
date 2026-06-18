import { ENV } from "../lib/env.js";

const PISTON_API = (ENV.PISTON_API_URL || "https://emkc.org/api/v2/piston").replace(/\/$/, "");
const JUDGE0_API = (ENV.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com").replace(/\/$/, "");

const LANGUAGE_CONFIG = {
  javascript: { language: "javascript", version: "18.15.0", extension: "js", judge0Id: 93 },
  python: { language: "python", version: "3.10.0", extension: "py", judge0Id: 92 },
  java: { language: "java", version: "15.0.2", extension: "java", judge0Id: 91 },
};

export async function executeCode(req, res) {
  try {
    const { language, code } = req.body;
    const languageConfig = LANGUAGE_CONFIG[language];

    if (!languageConfig) {
      return res.status(400).json({ message: `Unsupported language: ${language}` });
    }

    if ((ENV.CODE_RUNNER || "").toLowerCase() === "judge0") {
      return executeWithJudge0({ code, languageConfig, res });
    }

    return executeWithPiston({ code, languageConfig, res });
  } catch (error) {
    console.log("Error in executeCode controller:", error);
    res.status(503).json({
      message: `Code execution service is unavailable. Make sure ${
        (ENV.CODE_RUNNER || "").toLowerCase() === "judge0" ? "Judge0" : "Piston"
      } is configured correctly.`,
      details: ENV.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

async function executeWithPiston({ code, languageConfig, res }) {
  try {
    const response = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: languageConfig.language,
        version: languageConfig.version,
        files: [
          {
            name: `main.${languageConfig.extension}`,
            content: code,
          },
        ],
      }),
    });

    const responseText = await response.text();
    let data = null;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = { message: responseText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        message: data?.message || `Code execution failed with status ${response.status}`,
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.log("Error in executeWithPiston:", error);
    res.status(503).json({
      message: `Code execution service is unavailable. Make sure Piston is running at ${PISTON_API}.`,
      details: ENV.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

async function executeWithJudge0({ code, languageConfig, res }) {
  if (!ENV.JUDGE0_API_KEY) {
    return res.status(500).json({ message: "JUDGE0_API_KEY is missing in backend/.env" });
  }

  const headers = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": ENV.JUDGE0_API_KEY,
  };

  if (ENV.JUDGE0_API_HOST) {
    headers["X-RapidAPI-Host"] = ENV.JUDGE0_API_HOST;
  }

  const response = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: code,
      language_id: languageConfig.judge0Id,
    }),
  });

  const responseText = await response.text();
  let data = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = { message: responseText };
  }

  if (!response.ok) {
    return res.status(response.status).json({
      message: data?.message || data?.error || `Judge0 failed with status ${response.status}`,
    });
  }

  res.status(200).json({
    run: {
      stdout: data?.stdout || "",
      stderr: data?.stderr || data?.compile_output || "",
      output: data?.stdout || data?.stderr || data?.compile_output || data?.message || "",
      code: data?.status?.id === 3 ? 0 : 1,
      signal: null,
      message: data?.message || data?.status?.description || null,
      status: data?.status?.description || null,
    },
  });
}
