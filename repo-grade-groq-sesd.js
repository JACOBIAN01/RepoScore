const OpenAI = require("openai");
const { google } = require("googleapis");
const axios = require("axios");
const { file_identifier_prompt, content_eval_prompt } = require("./prompt_new");
require("dotenv").config();

const api_keys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7,
];

let api_key_count = 0;

function getClient() {
  return new OpenAI({
    apiKey: api_keys[api_key_count],
    baseURL: "https://api.groq.com/openai/v1",
  });
}
// ─── Google Sheets ───────────────────────────────────────────────────────────

async function getSheetData(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Form responses 1!A2:H5",
  });
  return res.data.values || [];
}


async function updateSheet(auth, rowIndex, result) {
  const sheets = google.sheets({ version: "v4", auth });
  const diag = result.breakdown.diagram_dist;

  const summaryText = Array.isArray(result.summary)
    ? result.summary.join("\n")
    : result.summary;

  //  Build R column: 1 line per file with what was found + mark justification
  const rel = result.relevance_summary || {};
  const relevanceText = [
    `• idea.md: ${rel["idea.md"] || "N/A"}`,
    `• useCaseDiagram.md: ${rel["useCaseDiagram.md"] || "N/A"}`,
    `• sequenceDiagram.md: ${rel["sequenceDiagram.md"] || "N/A"}`,
    `• classDiagram.md: ${rel["classDiagram.md"] || "N/A"}`,
    `• ErDiagram.md: ${rel["ErDiagram.md"] || "N/A"}`,
  ].join("\n");

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Form responses 1!I${rowIndex}:R${rowIndex}`, 
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          diag["idea.md"] || 0,            // I
          diag["useCaseDiagram.md"] || 0,  // J
          diag["sequenceDiagram.md"] || 0, // K
          diag["classDiagram.md"] || 0,    // L
          diag["ErDiagram.md"] || 0,       // M
          result.breakdown.backend || 0,   // N
          result.breakdown.frontend || 0,  // O
          result.final_score || 0,         // P
          summaryText || "",               // Q
          relevanceText || "",             // R ← file-by-file justification
        ],
      ],
    },
  });
  console.log("DONE");
}

// ─── GitHub ──────────────────────────────────────────────────────────────────

function parseRepoUrl(repoUrl) {
  const parts = repoUrl.replace("https://github.com/", "").split("/");
  return { owner: parts[0], repo: parts[1] };
}


async function getReportData(repoUrl) {
  try {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const headers = { Authorization: `token ${process.env.GITHUB_TOKEN}` };

    let readmeData = "";
    let filesData = [];
    let aboutData = { description: "", website: "" };

    try {
      const meta = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      aboutData = {
        description: meta.data.description || "",
        website: meta.data.homepage || "",
      };
    } catch {
      console.log(`No metadata for ${owner}/${repo}`);
    }


    try {
      const readme = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers }
      );
      readmeData = Buffer.from(readme.data.content, "base64").toString();
    } catch {
      console.log(`No README for ${owner}/${repo}`);
    }


    // Root files (required)
    try {
      const files = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
        { headers }
      );
      filesData = files.data.map((f) => f.name);
    } catch {
      console.log(`Cannot access repo ${owner}/${repo}`);
      return null;
    }

    return { readme: readmeData, files: filesData,about: aboutData };
  } catch {
    console.log("Invalid repo URL:", repoUrl);
    return null;
  }
}

async function fetchFileContent(owner, repo, filePath) {
  try {
    const headers = { Authorization: `token ${process.env.GITHUB_TOKEN}` };
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      { headers }
    );
    return Buffer.from(res.data.content, "base64").toString();
  } catch {
    return null;
  }
}

// ─── Groq / LLM ──────────────────────────────────────────────────────────────


async function askGroq(prompt) {
  while (api_key_count < api_keys.length) {
    try {
      const client = getClient();
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });

      const text = response.choices[0].message.content;
      const clean = text.replace(/```json|```/g, "").trim();
      try {
        return JSON.parse(clean);
      } catch {
        console.error("JSON parse failed. Raw output:\n", text);
        return null;
      }
    } catch (err) {
      if (err.status === 429 && api_key_count < api_keys.length - 1) {
        console.log(`Key ${api_key_count + 1} rate limited, rotating...`);
        api_key_count++;
      } else {
        throw err; // Out of keys or different error
      }
    }
  }
  throw new Error("All API keys exhausted");
}

// ─── Core Evaluator ──────────────────────────────────────────────────────────

async function evalRepo(repoData, repoUrl) {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const identifyPrompt = file_identifier_prompt(repoData.files, owner, repo);
  const fileMap = await askGroq(identifyPrompt);
  

  const fileContents = {};
  for (const [key, url] of Object.entries(fileMap)) {
    if (!url) {
      fileContents[key] = null;
      continue;
    }
    const filePath = url.split("/blob/main/")[1];
    fileContents[key] = await fetchFileContent(owner, repo, filePath);
  }

  const evalPrompt = content_eval_prompt(
    fileMap,
    fileContents,
    repoData.readme,
    repoData.files,
    repoData.about,
  );

  return await askGroq(evalPrompt);
 
}

// ─── Main Runner ─────────────────────────────────────────────────────────────

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
      console.log(`Skipping ${studentName} — repo inaccessible`);
      continue;
    }

    console.log(`\nEvaluating: ${studentName}`);
    try{
    const result = await evalRepo(repoData, repoUrl);
    await updateSheet(auth, i + 2, result);
    }catch(err){
      console.log(err);
    }
  }

  console.log("\nAll done!");
}

// ─── Entry Point ─────────────────────────────────────────────────────────────
// repoTest();
run();