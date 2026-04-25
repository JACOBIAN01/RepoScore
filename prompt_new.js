const file_identifier_prompt = (files, owner, repo) => `
You are a file classifier for a GitHub repository.

Repo files list:
${files.join("\n")}

GitHub base URL: https://github.com/${owner}/${repo}/blob/main/

Your task:
Map each of the following required documentation files to the BEST matching file from the repo list above.
Use flexible name matching based on intent, not exact name.

Required files to find:
- idea.md → matches: idea.md, project-idea.md, about.md, overview.md
- useCaseDiagram.md → matches: use.md, usecase.md, use-case.md, usecasediagram.md
- sequenceDiagram.md → matches: sequence.md, seq.md, seq-diagram.md, sequencediagram.md
- classDiagram.md → matches: class.md, class-diagram.md, classdiagram.md
- ErDiagram.md → matches: er.md, erd.md, database.md, database-diagram.md, erdiagram.md

Rules:
- If a match is found, return the full GitHub blob URL
- If no match is found, return null
- Match inside subfolders too (e.g., docs/idea.md is valid)
- Return ONLY JSON, no explanation

Return format:
{
  "idea.md": "https://github.com/${owner}/${repo}/blob/main/..." or null,
  "useCaseDiagram.md": "..." or null,
  "sequenceDiagram.md": "..." or null,
  "classDiagram.md": "..." or null,
  "ErDiagram.md": "..." or null
}
`;

const content_eval_prompt = (fileMap, fileContents, readmeSnippet, allFiles) => {

  // Use idea.md OR README as the project context
  const projectContext = fileContents["idea.md"] || readmeSnippet.slice(0, 500);

  return `
You are a SESD final project evaluator.
Total Marks = 10

Evaluate the project using the following scoring system:

---

PROJECT CONTEXT (what this project is about):
${projectContext}

Use the above context to judge whether each diagram is RELEVANT to THIS specific project.
A diagram copied from the internet or mismatched with the project idea = 0 marks.

---

1. Documentation Completeness (MANDATORY) → 5 marks

Required files:
- idea.md (project scope + key features)
- useCaseDiagram.md
- sequenceDiagram.md (end-to-end main flow)
- classDiagram.md (major classes + relationships)
- ErDiagram.md (tables + relationships)

Scoring rule:
- Each file = 1 mark
- A file earns the mark ONLY if BOTH conditions are met:
  A) It has meaningful content (not empty, not "TBD", not placeholder)
  B) The content is RELEVANT to the project described in PROJECT CONTEXT above
- Missing files = 0 marks
- Content that does not match the project domain = 0 marks

Flexible File Naming Rule:
File names do not need to match exactly. Similar or equivalent names are valid:
- idea.md, project-idea.md, about.md, overview.md
- use.md, usecase.md, use-case.md, usecasediagram.md
- sequence.md, seq-diagram.md, sequencediagram.md
- class.md, class-diagram.md, classdiagram.md
- er.md, erd.md, database-diagram.md, erdiagram.md
Evaluation should be based on intent and content, not strict naming.

Relevance Check Rules per file:
- idea.md: Describes THIS project's goals and features (not generic)
- useCaseDiagram.md: Actors and use cases match THIS project's users and features
- sequenceDiagram.md: Flow matches THIS project's core functionality
- classDiagram.md: Classes/entities match THIS project's domain (e.g. if hospital app → Patient, Doctor must exist)
- ErDiagram.md: Tables match THIS project's data requirements

File Contents to Evaluate:

${Object.entries(fileMap).map(([key, url]) => {
  const content = fileContents[key];
  if (!url || !content) return `### ${key}\nSTATUS: MISSING → 0 marks\n`;
  return `### ${key}
URL: ${url}
CONTENT (first 800 chars):
${content.slice(0, 800)}
---`;
}).join("\n")}

---

2. Backend Code Quality & OOP Implementation → 3 marks

Repo file structure:
${allFiles.join(", ")}

README (first 1500 chars):
${readmeSnippet.slice(0, 1500)}

Evaluate strictly:
- Codebase should reflect proper OOP principles (encapsulation, abstraction, modularity)
- Clear separation of concerns (controllers / services / repositories)
- Well-structured and maintainable backend code
- If backend structure is weak or not following OOP → deduct marks accordingly

Scoring:
- 3: Strong OOP, clear separation, well-structured
- 2: Partial OOP, some separation
- 1: Minimal structure, mostly procedural
- 0: No backend or completely unstructured

---

3. Frontend Quality → 2 marks

Evaluate strictly:
- UI structure and usability
- Proper integration with backend
- Component organization and clarity
- Check for a LIVE / HOSTED project link (in README or repo About section)
  - If NO hosted/live link is present → deduct 1 mark automatically
  - If present and working → full consideration

---

Strict Rules:
- Documentation scoring must be STRICT
- A file with content that does NOT match the project domain gets 0, even if the file exists
- Backend and frontend must be evaluated strictly
- Do NOT give full marks if project is incomplete

---

Return ONLY valid JSON (no markdown, no explanation):
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
  "summary": "Very short feedback in bullet points only explaining strengths and where marks were deducted",
  "relevance_summary": {
    "idea.md": "one line: what project is about e.g. Hospital Management System with patients, doctors, appointments — relevant  / missing ",
    "useCaseDiagram.md": "one line: actors and use cases found e.g. Actors: Patient, Doctor | Use Cases: Book Appointment, View Record — relevant  / not relevant ",
    "sequenceDiagram.md": "one line: flow found e.g. Patient → BookAppointment → Doctor → Confirm — relevant  / missing ",
    "classDiagram.md": "one line: classes found e.g. Classes: Patient, Doctor, Appointment, Prescription — relevant  / mismatch ",
    "ErDiagram.md": "one line: tables found e.g. Tables: users, appointments, prescriptions — relevant  / missing "
  }
}
`;
};

module.exports = { file_identifier_prompt, content_eval_prompt };