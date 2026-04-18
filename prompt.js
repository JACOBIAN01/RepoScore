const prompt_template =(data)=>  `
You are a SESD final project evaluator.

Total Marks = 10

Evaluate the project using the following scoring system:

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
- A file earns the mark ONLY if it is present AND contains meaningful content
- Empty files or placeholder content (e.g., blank, “TBD”, minimal text) = 0 marks
- Missing files = 0 marks (deduct 1 mark each)
- This section must be evaluated VERY STRICTLY with no assumptions
---

2. Backend Code Quality & OOP Implementation → 3 marks

Evaluate strictly:
- Codebase should reflect proper OOP principles (encapsulation, abstraction, modularity)
- Clear separation of concerns (controllers / services / repositories)
- Well-structured and maintainable backend code
- If backend structure is weak or not following OOP → deduct marks accordingly

---

3. Frontend Quality → 2 marks

Evaluate strictly:
- UI structure and usability
- Proper integration with backend
- Component organization and clarity
- Check for a LIVE / HOSTED project link (in README or repo About section)
  - If NO hosted/live link is present → deduct 1 mark
  - If present and working → full consideration

---

Repo Files:
${data.files.join(", ")}

README:
${data.readme.slice(0, 2000)}

---

Strict Rules:
- Documentation scoring must be STRICT (no assumptions, only actual files)
- Backend and frontend can be evaluated strictly
- Do NOT give full marks if project is incomplete

---

Return ONLY JSON:
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
  "summary": "Short feedback in bullet points explaining strengths and where marks were deducted"
}
`;

module.exports = prompt_template;