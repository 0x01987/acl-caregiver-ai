# 🩺 CareGuide AI

> Transforming complex care documents into caregiver-friendly action plans.

## 🎯 Overview

CareGuide AI is an AI-powered caregiver assistant designed to help family caregivers better understand discharge instructions, medication lists, care plans, and healthcare documents.

The platform analyzes uploaded documents and generates simple, actionable care plans that help caregivers:

* ✅ Understand medical instructions
* 💊 Manage medications
* 📋 Track daily care tasks
* ⚠ Identify warning signs
* 📅 Follow up with healthcare providers

This project is being developed as a submission for the ACL (Administration for Community Living) Caregiver AI Challenge.

---

## 🚀 Current Features

### Document Processing

* TXT document upload
* PDF document upload
* JPG image upload
* PNG image upload

### AI Analysis

* OpenAI-powered care plan generation
* Caregiver-friendly summaries
* Daily task extraction
* Medication identification
* Warning sign detection
* Follow-up recommendations

### OCR Support

* Text-based PDF extraction (PyMuPDF)
* Image OCR (Tesseract OCR)

### Web Application

* Next.js frontend
* FastAPI backend
* Responsive user interface
* Real-time document analysis

---

## 🏗 Architecture

```text
Caregiver
    ↓
Next.js Frontend
    ↓
FastAPI API
    ↓
PDF / OCR Processing
    ↓
OpenAI Analysis
    ↓
Care Plan Generation
    ↓
Caregiver Dashboard
```

---

## 🛠 Technology Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS

### Backend

* FastAPI
* Python

### AI

* OpenAI API

### Document Processing

* PyMuPDF
* Tesseract OCR
* Pillow

---

## 📂 Project Structure

```text
acl-caregiver-ai/
│
├── README.md
├── .gitignore
│
├── backend/
│   ├── app/
│   ├── uploads/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│
└── docs/
```

---

## ⚙️ Backend Setup

### Create Virtual Environment

```powershell
cd backend

python -m venv venv

.\venv\Scripts\activate
```

### Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

### Configure Environment Variables

Create:

```text
backend/.env
```

Add:

```env
OPENAI_API_KEY=YOUR_API_KEY_HERE
```

### Start Backend

```powershell
uvicorn app.main:app --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

Swagger Docs:

```text
http://127.0.0.1:8000/docs
```

---

## 💻 Frontend Setup

```powershell
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## 🔒 Security

The following files are excluded from Git:

* `.env`
* Python virtual environments
* Node modules
* Next.js build artifacts
* Upload directories

---

## ⚠ Disclaimer

CareGuide AI does not provide medical advice.

The platform is intended to help caregivers better organize and understand healthcare information. Users should always consult qualified healthcare professionals regarding medical decisions.

---

## 🗺 Roadmap

### Phase 1 (Current)

* Document upload
* PDF extraction
* OCR support
* AI-generated care plans

### Phase 2

* Structured JSON responses
* Caregiver dashboard cards
* Medication timeline
* Follow-up tracking

### Phase 3

* Care plan history
* Family sharing
* Export to PDF
* Community resource recommendations

---

## ❤️ Mission

Family caregivers spend countless hours interpreting discharge instructions, medication lists, and healthcare documents.

CareGuide AI aims to reduce caregiver burden by transforming complex medical information into simple, actionable care plans that improve understanding, coordination, and confidence while supporting aging in place.
