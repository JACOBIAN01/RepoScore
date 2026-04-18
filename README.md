# 🚀 RepoGrade AI

An AI-powered GitHub repository evaluator that automatically analyzes student projects and assigns scores with concise feedback.

Designed for educators, hiring teams, and evaluators to streamline large-scale GitHub-based assessments.

---

## 🧠 Overview

RepoGrade AI reads GitHub repositories submitted via Google Forms (stored in Google Sheets), evaluates them using AI, and writes back:

- ✅ Score (out of 10)
- 📝 Short feedback summary

This eliminates manual evaluation and ensures consistent, scalable assessment.

---

## ⚙️ Features

- 🔍 Fetches GitHub repository data (README + file structure)
- 🤖 AI-based evaluation using LLM
- 📊 Google Sheets integration (input + output)
- ⚡ Automated batch processing

---

## 🏗️ Architecture

---

## 🧪 SESD Final Project Evaluation Criteria

**Total Marks: 10**

### 📊 Mark Distribution

| Category                              | Marks |
|--------------------------------------|-------|
| Documentation Completeness            | 5     |
| Backend (Code Quality + OOP)          | 3     |
| Frontend Quality                      | 2     |
| **Total**                             | **10**|

---

## 1. 📄 Documentation Completeness (MANDATORY) — 5 Marks

### Required Files (1 mark each)

- `idea.md` — Project scope + key features  
- `useCaseDiagram.md`  
- `sequenceDiagram.md` — End-to-end main flow  
- `classDiagram.md` — Major classes + relationships  
- `ErDiagram.md` — Database tables + relationships  

### Scoring Rules

- Each file = **1 mark**
- File must be:
  - Present **AND**
  - Contain **meaningful content**
- The following will receive **0 marks**:
  - Missing files
  - Empty files
  - Placeholder content (e.g., "TBD", minimal text)

### ⚠️ Strict Evaluation

- No assumptions will be made
- Presence alone is NOT sufficient
- Content quality must be clearly valid

---

## 2. ⚙️ Backend (Code Quality & OOP) — 3 Marks

### Evaluation Criteria

- Proper use of **OOP principles**
  - Encapsulation
  - Abstraction
  - Modularity
- Clear **architecture separation**
  - Controllers / Services / Repositories
- Code should be:
  - Well-structured
  - Readable
  - Maintainable
- Basic API design and error handling

### Deduction Rules

- Weak or missing architecture → marks deducted
- Poor OOP implementation → marks deducted
- Unstructured or tightly coupled code → marks deducted

---

## 3. 🎨 Frontend Quality — 2 Marks

### Evaluation Criteria

- UI structure and usability
- Proper integration with backend
- Component organization and clarity

### 🌐 Hosted Project Requirement

- A **LIVE / HOSTED link** must be present in:
  - README **or**
  - Repository About section

### Deduction Rules

- No hosted/live link → **-1 mark**
- Poor UI / no integration → further deductions

---

## 🚨 Important Rules

- Documentation evaluation is **VERY STRICT**
- Backend and frontend are evaluated **strictly but fairly**
- Incomplete projects **must not receive high scores**

---

## 📝 Output Structure (for evaluation system)

- Final Score (0–10)
- Diagram-wise scoring (0/1 per file)
- Backend score (0–3)
- Frontend score (0–2)
- Concise feedback with clear deductions

## Example JSON Response
    {final_score: 8,
    diagrams: 5,
    breakdown: {
      diagram_dist: {
        "idea.md": 1,
        "useCaseDiagram.md": 1,
        "sequenceDiagram.md": 1,
        "classDiagram.md": 1,
        "ErDiagram.md": 1,
      },
      backend: 2,
      frontend: 1,
    },
    summary:
      "- All required documentation files are present\n- Backend is decent but can improve OOP\n- No hosted frontend link",
  };

---

## 🛠️ Tech Stack

- Node.js
- Google Sheets API
- GitHub REST API
- GEMINI API 
