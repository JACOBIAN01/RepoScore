const file_identifier_prompt = (files, owner, repo) => `
You are a file classifier for a GitHub repository.

Repo files:
${files.join("\n")}

Base URL: https://github.com/${owner}/${repo}/blob/main/

Map each required doc to the BEST matching repo file using intent-based keyword matching (NOT exact name/extension).

Required mappings (any extension accepted: .md, .jpg, .png, .svg, .pdf, .drawio, etc.):
- idea.md          → keywords: idea, project-idea, about, overview
- useCaseDiagram.md → keywords: use, usecase, use-case, usecasediagram, use_case
- sequenceDiagram.md → keywords: sequence, seq, seq-diagram, sequencediagram, sequence_diagram
- classDiagram.md   → keywords: class, class-diagram, classdiagram, class_diagram
- ErDiagram.md      → keywords: er, erd, database, database-diagram, erdiagram, er_diagram, db

Rules:
- Match any extension and inside subfolders (e.g. docs/idea.md, assets/erd.jpg)
- Case-insensitive matching
- Multiple matches → prefer: .md > .jpg > .png > others
- No match → null

Return ONLY raw JSON, no explanation:
{
  "idea.md": "https://github.com/${owner}/${repo}/blob/main/..." or null,
  "useCaseDiagram.md": "..." or null,
  "sequenceDiagram.md": "..." or null,
  "classDiagram.md": "..." or null,
  "ErDiagram.md": "..." or null
}
`;


const content_eval_prompt = (fileMap, fileContents, readmeSnippet, allFiles) => {
  const projectContext = fileContents["idea.md"] || readmeSnippet.slice(0, 500);

  return `
You are a SESD final project evaluator. Total Marks = 10.

PROJECT CONTEXT:
${projectContext}
All diagrams/code must be relevant to THIS project. Mismatched or generic content = 0 marks.

---

1. Documentation Completeness → 5 marks (1 per file)

Files required: idea.md, useCaseDiagram.md, sequenceDiagram.md, classDiagram.md, ErDiagram.md

A file earns 1 mark only if:
  A) Has meaningful content (not empty/TBD/placeholder)
     → IMAGE files (.jpg/.png/.svg/.gif/.webp/.drawio/.pdf): valid URL = meaningful content
  B) Is RELEVANT to the project context
     → IMAGE files: relevance judged by filename/folder path semantics only

Flexible naming (any extension valid):
- idea → project-idea, about, overview
- useCaseDiagram → use, usecase, use-case, usecasediagram
- sequenceDiagram → sequence, seq, seq-diagram, sequencediagram
- classDiagram → class, class-diagram, classdiagram
- ErDiagram → er, erd, database-diagram, erdiagram

Relevance rules:
- idea.md: project-specific goals/features (not generic)
- useCaseDiagram.md: actors + use cases match THIS project's users/features
- sequenceDiagram.md: flow matches THIS project's core functionality
- classDiagram.md: classes match THIS project's domain (hospital app → Patient, Doctor required)
- ErDiagram.md: tables match THIS project's data requirements

Files:
${Object.entries(fileMap).map(([key, url]) => {
  const content = fileContents[key];
  const isImage = url && /\.(jpg|jpeg|png|gif|svg|webp|drawio|pdf)$/i.test(url);

  if (!url || (!content && !isImage)) return `### ${key}\nSTATUS: MISSING → 0 marks`;

  if (isImage) return `### ${key}\nURL: ${url}\nTYPE: Image — evaluate by URL presence + filename semantics`;

  return `### ${key}\nURL: ${url}\nCONTENT:\n${content.slice(0, 800)}`;
}).join("\n---\n")}

---

2. Backend Code Quality & OOP → 3 marks

File structure: ${allFiles.join(", ")}
README: ${readmeSnippet.slice(0, 1500)}

Score:
- 3: Strong OOP, clear separation (controllers/services/repositories)
- 2: Partial OOP, some separation
- 1: Minimal structure, mostly procedural
- 0: No backend or completely unstructured

---

3. Frontend Quality → 2 marks

Evaluate: UI usability, backend integration, component organization.
No live/hosted link found in README or repo or about section (Strictly find everywhere) → deduct 1 mark automatically.

---

STRICT RULES:
- Domain mismatch = 0, even if file exists
- No full marks for incomplete projects

Return ONLY valid JSON:
{
  "final_score": number (0-10),
  "diagrams": number (0-5),
  "breakdown": {
    "diagram_dist": {
      "idea.md": 0 or 1,
      "useCaseDiagram.md": 0 or 1,
      "sequenceDiagram.md": 0 or 1,
      "classDiagram.md": 0 or 1,
      "ErDiagram.md": 0 or 1
    },
    "backend": number (0-3),
    "frontend": number (0-2)
  },
  "summary": "bullet points: strengths + deductions only",
  "relevance_summary": {
    "idea.md": "e.g. Hospital Management System — relevant / missing",
    "useCaseDiagram.md": "e.g. Actors: Patient, Doctor | Use Cases: Book Appointment — relevant / not relevant",
    "sequenceDiagram.md": "e.g. Patient → BookAppointment → Doctor → Confirm — relevant / missing",
    "classDiagram.md": "e.g. Classes: Patient, Doctor, Appointment — relevant / mismatch",
    "ErDiagram.md": "e.g. Tables: users, appointments, prescriptions — relevant / missing"
  }
}
`;
};

module.exports = { file_identifier_prompt, content_eval_prompt };