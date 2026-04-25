const OpenAI = require("openai");
const { google } = require("googleapis");
const axios = require("axios");
const prompt_template = require("./prompt");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Get Data From Google
async function getSheetData(auth) {
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Form responses 1!A2:H",
  });

  return res.data.values || [];
}

// Fetch GitHub Repo Data
async function getReportData(repoUrl) {
  try {
    const [_, owner, repo] = repoUrl.split("/").slice(-3);

    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    };

    let readmeData = "";
    let filesData = [];

    // README (optional)
    try {
      const readme = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers },
      );

      readmeData = Buffer.from(readme.data.content, "base64").toString();
    } catch (err) {
      console.log(`No README for ${owner}/${repo}`);
    }

    // FILES (required)
    try {
      const files = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
        { headers },
      );

      filesData = files.data.map((f) => f.name);
    } catch (err) {
      console.log(`Cannot access repo ${owner}/${repo}`);
      return null;
    }

    return {
      readme: readmeData,
      files: filesData,
    };
  } catch (err) {
    console.log("Invalid repo URL:", repoUrl);
    return null;
  }
}

async function evalRepo(data) {
  const prompt = prompt_template(data);

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile", 
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2, // better for consistent JSON output
  });

  const text = response.choices[0].message.content;

  // Clean markdown ```json blocks (same as before)
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("JSON parse failed. Raw output:\n", text);
    throw err;
  }
}


// Update Sheet
async function updateSheet(auth, rowIndex, result) {
  const sheets = google.sheets({ version: "v4", auth });

  const diag = result.breakdown.diagram_dist;

  const summaryText = Array.isArray(result.summary)
    ? result.summary.join("\n")
    : result.summary;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Form responses 1!I${rowIndex}:Q${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          diag["idea.md"] || 0,
          diag["useCaseDiagram.md"] || 0,
          diag["sequenceDiagram.md"] || 0,
          diag["classDiagram.md"] || 0,
          diag["ErDiagram.md"] || 0,
          result.breakdown.backend || 0,
          result.breakdown.frontend || 0,
          result.final_score || 0,
          summaryText || "",
        ],
      ],
    },
  });
}

// Main Runner
async function run() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const rows = await getSheetData(auth);

  for (let i = 0; i < rows.length; i++) {
    const repoUrl = rows[i][7];
    const studentName = rows[i][2];

    if (!repoUrl) continue;

    const repoData = await getReportData(repoUrl);

    if (!repoData) {
      console.log(`Skipping ${studentName}`);
      continue;
    }

    console.log(`Evaluating: ${studentName}`);

    const evaluator = evalRepo;

    const result = await evaluator(repoData);

    console.log("Result:", result);
    await updateSheet(auth, i + 2, result);
  }
}

run();
