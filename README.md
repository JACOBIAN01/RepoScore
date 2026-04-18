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
- 🔐 Secure API-based architecture

---

## 🏗️ Architecture

---

## 🧪 Evaluation Criteria

Each repository is evaluated based on:

| Criteria              | Weight |
|----------------------|--------|
| README Quality       | 2      |
| Project Structure    | 2      |
| Code Quality         | 2      |
| Real-world Use Case  | 2      |
| Cleanliness          | 2      |

Final score is assigned out of **10**.

---

## 🛠️ Tech Stack

- Node.js
- Google Sheets API
- GitHub REST API
- OpenAI API
