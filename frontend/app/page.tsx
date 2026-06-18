"use client";

import { useState } from "react";

type Medication = {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
};

type CarePlan = {
  summary: string;
  daily_tasks: string[];
  medications: Medication[];
  warning_signs: string[];
  follow_up: string[];
  disclaimer: string;
};

type TimelineItem = {
  time: string;
  event: string;
};

type AssistantMessage = {
  question: string;
  answer: string;
  time: string;
};

const presetSymptoms = [
  "Confusion",
  "Fatigue",
  "Dizziness",
  "Pain",
  "Poor appetite",
  "Trouble sleeping",
];

const suggestedQuestions = [
  "What warning signs should I monitor?",
  "What follow-up actions remain?",
  "Summarize today's care status.",
  "Create a family update.",
  "Review today's symptoms.",
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const urgentTerms = [
  "chest pain",
  "trouble breathing",
  "difficulty breathing",
  "fainting",
  "unresponsive",
  "stroke",
  "severe bleeding",
  "blue lips",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [careRecipientName, setCareRecipientName] = useState("");
  const [primaryCaregiver, setPrimaryCaregiver] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [careFocus, setCareFocus] = useState("");
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [completedFollowUps, setCompletedFollowUps] = useState<number[]>([]);
  const [loggedSymptoms, setLoggedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [copyMessage, setCopyMessage] = useState("");
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [assistantHistory, setAssistantHistory] = useState<AssistantMessage[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTime = () => new Date().toLocaleString();

  const addTimelineEvent = (event: string) => {
    setTimeline((prev) => [{ time: currentTime(), event }, ...prev]);
  };

  const exportCareSummary = () => {
    window.print();
  };

const buildCareContext = () => {
  return {
    care_recipient_profile: {
      name: careRecipientName || "Not specified",
      primary_caregiver: primaryCaregiver || "Not specified",
      emergency_contact: emergencyContact || "Not specified",
      care_focus: careFocus || "Not specified",
    },
    care_plan: carePlan,
    completed_tasks: completedTasks,
    completed_follow_ups: completedFollowUps,
    logged_symptoms: loggedSymptoms,
    caregiver_notes: notes,
    timeline,
  };
};

  const askCareGuide = async (questionOverride?: string) => {
    const question = (questionOverride ?? assistantQuestion).trim();

    if (!carePlan) {
      setAssistantAnswer("Please generate a care plan first.");
      return;
    }

    if (!question) {
      setAssistantAnswer("Please enter a question first.");
      return;
    }

    const hasUrgentTerm = urgentTerms.some((term) =>
      question.toLowerCase().includes(term)
    );

    setAssistantLoading(true);
    setAssistantAnswer(
      hasUrgentTerm
        ? "If this may be an emergency, call 911 or local emergency services now. CareGuide AI can help organize information, but it cannot rule out urgent danger."
        : ""
    );

    try {
      const response = await fetch(`${API_BASE_URL}/assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          care_context: buildCareContext(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAssistantAnswer(data.detail || "Unable to get assistant response.");
        return;
      }

const answer = data.answer || "No response received.";

setAssistantAnswer(answer);

setAssistantHistory((prev) => [
  {
    question,
    answer,
    time: currentTime(),
  },
  ...prev,
]);

addTimelineEvent(`Asked CareGuide AI: ${question}`);
setAssistantQuestion("");
    } catch (error) {
      console.error(error);
      setAssistantAnswer("Unable to contact CareGuide AI. Please try again.");
    } finally {
      setAssistantLoading(false);
    }
  };
 const generateCareStatusReport = async () => {
  await askCareGuide(
    "Generate a concise care status report for today. Include completed tasks, remaining tasks, completed follow-up actions, pending follow-up actions, logged symptoms, caregiver notes, and recent timeline activity. Keep it caregiver-friendly and action-oriented."
  );
};

const generateShiftHandoffReport = async () => {
  await askCareGuide(
    "Generate a caregiver shift handoff report. Include the care recipient profile, completed tasks, pending tasks, completed follow-up actions, pending follow-up actions, logged symptoms, caregiver notes, recent timeline activity, and any important warning signs. Keep it concise, caregiver-friendly, and organized for the next caregiver."
  );
};

  const copyFamilySummary = async () => {
    if (!carePlan) return;

    const summary = `
CareGuide AI - Family Care Summary

Care Recipient Profile:
- Name: ${careRecipientName || "Not specified"}
- Primary Caregiver: ${primaryCaregiver || "Not specified"}
- Emergency Contact: ${emergencyContact || "Not specified"}
- Care Focus: ${careFocus || "Not specified"}

Summary:
${carePlan.summary || "Not specified"}

Medications:
${
  carePlan.medications?.length > 0
    ? carePlan.medications
        .map(
          (med) =>
            `- ${med.name || "Not specified"} | ${med.dosage || "Not specified"} | ${
              med.frequency || "Not specified"
            } | ${med.instructions || "Not specified"}`
        )
        .join("\n")
    : "None listed"
}

Daily Tasks:
${
  carePlan.daily_tasks?.length > 0
    ? carePlan.daily_tasks
        .map((task, index) =>
          completedTasks.includes(index)
            ? `- [Done] ${task}`
            : `- [Pending] ${task}`
        )
        .join("\n")
    : "None listed"
}

Follow-Up Actions:
${
  carePlan.follow_up?.length > 0
    ? carePlan.follow_up
        .map((item, index) =>
          completedFollowUps.includes(index)
            ? `- [Done] ${item}`
            : `- [Pending] ${item}`
        )
        .join("\n")
    : "None listed"
}

Warning Signs:
${
  carePlan.warning_signs?.length > 0
    ? carePlan.warning_signs.map((item) => `- ${item}`).join("\n")
    : "None listed"
}

Logged Symptoms / Observations:
${
  loggedSymptoms.length > 0
    ? loggedSymptoms.map((symptom) => `- ${symptom}`).join("\n")
    : "None logged"
}

Caregiver Notes:
${notes.length > 0 ? notes.map((note) => `- ${note}`).join("\n") : "None added"}

Recent Timeline:
${
  timeline.length > 0
    ? timeline.map((item) => `- ${item.time}: ${item.event}`).join("\n")
    : "No timeline events"
}

Disclaimer:
${
  carePlan.disclaimer ||
  "This tool does not provide medical advice. Contact a licensed healthcare professional for medical concerns."
}
`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary.trim());
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = summary.trim();
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopyMessage("Family care summary copied to clipboard.");
      addTimelineEvent("Copied family care summary");
    } catch (error) {
      console.error(error);
      setCopyMessage("Unable to copy summary. Please try again.");
    }
  };

  const toggleTask = (index: number, task: string) => {
    const isCompleted = completedTasks.includes(index);

    setCompletedTasks((prev) =>
      isCompleted ? prev.filter((item) => item !== index) : [...prev, index]
    );

    addTimelineEvent(
      isCompleted ? `Reopened task: ${task}` : `Completed task: ${task}`
    );
  };

  const toggleFollowUp = (index: number, item: string) => {
    const isCompleted = completedFollowUps.includes(index);

    setCompletedFollowUps((prev) =>
      isCompleted
        ? prev.filter((followUp) => followUp !== index)
        : [...prev, index]
    );

    addTimelineEvent(
      isCompleted
        ? `Reopened follow-up action: ${item}`
        : `Completed follow-up action: ${item}`
    );
  };

  const toggleSymptom = (symptom: string) => {
    const isLogged = loggedSymptoms.includes(symptom);

    setLoggedSymptoms((prev) =>
      isLogged ? prev.filter((item) => item !== symptom) : [...prev, symptom]
    );

    addTimelineEvent(
      isLogged ? `Removed symptom: ${symptom}` : `Logged symptom: ${symptom}`
    );
  };

  const addCustomSymptom = () => {
    const cleanSymptom = customSymptom.trim();

    if (!cleanSymptom) return;
    if (loggedSymptoms.includes(cleanSymptom)) {
      setCustomSymptom("");
      return;
    }

    setLoggedSymptoms((prev) => [...prev, cleanSymptom]);
    setCustomSymptom("");
    addTimelineEvent(`Logged custom symptom: ${cleanSymptom}`);
  };

  const addNote = () => {
    if (!noteText.trim()) return;

    const timestamp = currentTime();
    const cleanNote = noteText.trim();

    setNotes((prev) => [`${timestamp}: ${cleanNote}`, ...prev]);
    setNoteText("");
    addTimelineEvent(`Added caregiver note: ${cleanNote}`);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setCarePlan(null);
    setCompletedTasks([]);
    setCompletedFollowUps([]);
    setLoggedSymptoms([]);
    setCustomSymptom("");
    setNotes([]);
    setNoteText("");
    setTimeline([]);
    setCopyMessage("");
    setAssistantQuestion("");
    setAssistantAnswer("");
    setAssistantHistory([]);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/extract`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Unable to generate care plan.");
        return;
      }

      setCarePlan(data);
      addTimelineEvent(`Generated care plan from ${file.name}`);
    } catch (error) {
      console.error(error);
      setError("Unable to generate care plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = completedTasks.length;
  const totalTasks = carePlan?.daily_tasks?.length || 0;

  const completedFollowUpCount = completedFollowUps.length;
  const totalFollowUps = carePlan?.follow_up?.length || 0;
  const taskPercent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const followUpPercent =
    totalFollowUps > 0
      ? Math.round((completedFollowUpCount / totalFollowUps) * 100)
      : 0;
  const nextStep = !file
    ? "Choose a care document to begin."
    : !carePlan
      ? "Generate the care plan."
      : completedCount < totalTasks
        ? "Review today's remaining tasks."
        : "Share an update or add notes.";

  return (
<main
  className={`min-h-screen px-4 py-5 sm:px-6 sm:py-8 ${
    highContrast ? "high-contrast" : "bg-stone-100 text-slate-950"
  } ${largeText ? "text-lg" : ""}`}
>
      <div className="mx-auto max-w-7xl">
        <section className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <p className="mb-2 text-sm font-bold uppercase text-teal-700">
                ACL Caregiver AI Challenge
              </p>

              <h1 className="mb-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                CareGuide AI
              </h1>

              <p className="max-w-3xl text-xl leading-8 text-slate-700">
                Turn discharge papers, medication lists, or caregiver notes into
                a simple plan for today.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Upload", "Review", "Share"].map((label, index) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-bold uppercase text-slate-500">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-teal-900 p-6 text-white lg:border-l lg:border-t-0">
              <p className="text-sm font-bold uppercase text-teal-100">
                Next best action
              </p>
              <p className="mt-2 text-2xl font-black leading-8">{nextStep}</p>
              <p className="mt-4 text-base leading-7 text-teal-50">
                CareGuide organizes information only. A caregiver or clinician
                always makes care decisions.
              </p>
            </aside>
          </div>
        </section>

        <nav className="sticky top-0 z-10 mb-5 flex gap-2 overflow-x-auto border-y border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur print:hidden">
          {[
            ["Upload", "#upload"],
            ["Plan", "#dashboard"],
            ["Tasks", "#tasks"],
            ["Ask AI", "#assistant"],
            ["Share", "#share"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="min-h-12 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:border-teal-500 hover:bg-teal-50"
            >
              {label}
            </a>
          ))}
        </nav>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div
            id="upload"
            className="rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-sm print:hidden lg:sticky lg:top-20 lg:self-start"
          >
            <div className="mb-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setLargeText((prev) => !prev)}
                className={`min-h-14 rounded-lg border px-3 py-2 text-sm font-black ${
                  largeText
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {largeText ? "Large text on" : "Large text"}
              </button>

              <button
                onClick={() => setHighContrast((prev) => !prev)}
                className={`min-h-14 rounded-lg border px-3 py-2 text-sm font-black ${
                  highContrast
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                {highContrast ? "Contrast on" : "High contrast"}
              </button>
            </div>

            <h2 className="mb-2 text-2xl font-black">Start Here</h2>
            <p className="mb-4 text-base leading-7 text-slate-600">
              Upload one document. The plan appears on the right.
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-teal-300 bg-teal-50 p-7 text-center hover:bg-teal-100">
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-white text-2xl font-black text-teal-700">
                1
              </div>

              <p className="mb-2 text-lg font-black text-slate-900">
                Choose a care document
              </p>

              <p className="mb-4 text-sm leading-6 text-slate-600">
                TXT, PDF, JPG, or PNG
              </p>

              <input
                type="file"
                accept=".txt,.pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              {file && (
                <p className="mt-3 max-w-full rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  Selected: {file.name}
                </p>
              )}
            </label>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="mt-4 min-h-14 w-full rounded-lg bg-teal-700 px-5 py-3 text-lg font-black text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Analyzing document..." : "Generate Care Plan"}
            </button>

            {carePlan && (
              <>
                <button
                  onClick={exportCareSummary}
                  className="mt-4 min-h-12 w-full rounded-lg bg-slate-900 px-5 py-3 text-base font-black text-white hover:bg-slate-950"
                >
                  Export Care Summary
                </button>

                <button
                  onClick={copyFamilySummary}
                  className="mt-3 min-h-12 w-full rounded-lg bg-emerald-700 px-5 py-3 text-base font-black text-white hover:bg-emerald-800"
                >
                  Copy Family Summary
                </button>
              </>
            )}

            {copyMessage && (
               <div className="status-message mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
               {copyMessage}
               </div>
             )}

            {error && (
              <div className="status-message mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
                {error}
              </div>
            )}

            {carePlan && totalTasks > 0 && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                <div className="flex items-center justify-between gap-3 font-black">
                  <span>Tasks</span>
                  <span>{taskPercent}%</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-white">
                  <div
                    className="h-3 rounded-full bg-green-700"
                    style={{ width: `${taskPercent}%` }}
                  />
                </div>
                <p className="mt-2 font-semibold">
                  {completedCount} of {totalTasks} completed
                </p>
              </div>
            )}

            {carePlan && totalFollowUps > 0 && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <div className="flex items-center justify-between gap-3 font-black">
                  <span>Follow-ups</span>
                  <span>{followUpPercent}%</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-white">
                  <div
                    className="h-3 rounded-full bg-blue-700"
                    style={{ width: `${followUpPercent}%` }}
                  />
                </div>
                <p className="mt-2 font-semibold">
                  {completedFollowUpCount} of {totalFollowUps} completed
                </p>
              </div>
            )}

            {loggedSymptoms.length > 0 && (
              <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
                Symptoms logged: {loggedSymptoms.length}
              </div>
            )}

            {notes.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Notes added: {notes.length}
              </div>
            )}

            {timeline.length > 0 && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                Timeline events: {timeline.length}
              </div>
            )}

            <p className="mt-4 text-sm leading-6 text-slate-600">
              This prototype does not provide medical advice. It helps organize
              care information for review by caregivers and healthcare
              professionals.
            </p>
          </div>

          <div
            id="dashboard"
            className="rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-sm print:rounded-none print:shadow-none sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-teal-700">
                  Care workspace
                </p>
                <h2 className="text-3xl font-black">Today&apos;s Care Plan</h2>
                {carePlan && (
                  <p className="mt-1 text-base text-slate-600">
                    Generated by CareGuide AI. Review before acting.
                  </p>
                )}
              </div>

              {carePlan && (
                <button
                  onClick={exportCareSummary}
                  className="min-h-12 rounded-lg bg-slate-900 px-5 py-3 text-sm font-black text-white hover:bg-slate-950 print:hidden"
                >
                  Export
                </button>
              )}
            </div>

            {!carePlan && !loading && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-slate-700">
                <p className="text-xl font-black text-slate-950">
                  No care plan yet.
                </p>
                <p className="mt-2 max-w-2xl leading-7">
                  Start by uploading a document on the left. After analysis,
                  your summary, tasks, medicines, warning signs, and sharing
                  tools will appear here.
                </p>
              </div>
            )}

            {loading && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-5 text-teal-900">
                Analyzing the document and building a caregiver-friendly care
                plan...
              </div>
            )}

            {carePlan && (
              <div className="space-y-5">
                <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-2 text-sm font-bold uppercase text-slate-500">
                    Quick summary
                  </p>
                  <h3 className="mb-2 text-2xl font-black">What this says</h3>
                  <p className="text-lg leading-8 text-slate-700">
                    {carePlan.summary || "Not specified"}
                  </p>
                </section>
           
<section className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 print:hidden">
  <p className="mb-2 text-sm font-bold uppercase text-cyan-800">
    Optional
  </p>
  <h3 className="mb-3 text-2xl font-black">Care Recipient Profile</h3>

  <div className="grid gap-3 md:grid-cols-2">
    <input
      value={careRecipientName}
      onChange={(e) => setCareRecipientName(e.target.value)}
      placeholder="Care recipient name"
      className="min-h-12 rounded-lg border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />

    <input
      value={primaryCaregiver}
      onChange={(e) => setPrimaryCaregiver(e.target.value)}
      placeholder="Primary caregiver"
      className="min-h-12 rounded-lg border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />

    <input
      value={emergencyContact}
      onChange={(e) => setEmergencyContact(e.target.value)}
      placeholder="Emergency contact"
      className="min-h-12 rounded-lg border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />

    <input
      value={careFocus}
      onChange={(e) => setCareFocus(e.target.value)}
      placeholder="Care focus, e.g. post-discharge recovery"
      className="min-h-12 rounded-lg border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />
  </div>

  <p className="mt-3 text-sm leading-6 text-slate-600">
    This optional profile helps personalize caregiver summaries and AI assistant responses.
  </p>
</section>

                <section
                  id="assistant"
                  className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 print:hidden"
                >
                  <p className="mb-2 text-sm font-bold uppercase text-indigo-800">
                    Ask for help
                  </p>
                  <h3 className="mb-3 text-2xl font-black">CareGuide AI</h3>

                  <p className="mb-4 leading-7 text-slate-700">
                    Ask about this care plan, logged symptoms, notes, and
                    timeline.
                  </p>

                  <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  <button
                   onClick={generateCareStatusReport}
                   className="min-h-12 rounded-lg border border-indigo-300 bg-indigo-700 px-3 py-2 text-sm font-black text-white hover:bg-indigo-800"
  >
    Generate Status Report
  </button>
  
  <button
  onClick={generateShiftHandoffReport}
  className="min-h-12 rounded-lg border border-teal-300 bg-teal-700 px-3 py-2 text-sm font-black text-white hover:bg-teal-800"
>
  Generate Handoff Report
</button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
  {suggestedQuestions.map((question) => (
    <button
      key={question}
      onClick={() => setAssistantQuestion(question)}
      className="min-h-10 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
    >
      {question}
    </button>
  ))}
</div>

                  <textarea
                    value={assistantQuestion}
                    onChange={(e) => setAssistantQuestion(e.target.value)}
                    placeholder="Example: Mom seems more confused today. What should I do?"
                    className="min-h-28 w-full rounded-lg border border-indigo-200 bg-white p-3 text-slate-800 outline-none focus:border-indigo-500"
                  />

                  <button
                    id="ask-careguide-button"
                    onClick={() => askCareGuide()}
                    disabled={assistantLoading}
                    className="mt-3 min-h-12 w-full rounded-lg bg-indigo-700 px-4 py-2 text-base font-black text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
                  >
                    {assistantLoading ? "Thinking..." : "Ask CareGuide AI"}
                  </button>

{assistantAnswer && (
  <div className="mt-4 rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-5 shadow-sm">
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xl">🤖</span>

      <p className="font-semibold text-indigo-900">
        CareGuide AI Response
      </p>
    </div>

    <div className="whitespace-pre-wrap text-base leading-8 text-slate-800">
      {assistantAnswer.includes("Care Status Report") ? (
  <div className="rounded-xl border border-green-300 bg-green-50 p-4">
    {assistantAnswer}
  </div>
) : (
  assistantAnswer
)}
    </div>
  </div>
)}
{assistantHistory.length > 0 && (
  <div className="mt-4 space-y-3">
    <p className="text-sm font-semibold text-indigo-900">
      Conversation History
    </p>

    {assistantHistory.map((message, index) => (
      <div
        key={index}
        className="rounded-xl border border-indigo-100 bg-white p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          {message.time}
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-800">
          Caregiver:
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          {message.question}
        </p>

        <p className="mt-3 text-sm font-semibold text-slate-800">
          CareGuide AI:
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {message.answer}
        </p>
      </div>
    ))}
  </div>
)}

                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    CareGuide AI provides caregiver support only. It does not
                    diagnose, prescribe, or replace licensed medical guidance.
                  </p>
                </section>

                {/* Keep your existing dashboard sections below this line */}
                <section
                  id="tasks"
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase text-slate-500">
                        Do today
                      </p>
                      <h3 className="text-2xl font-black">Daily Tasks</h3>
                    </div>

                    {totalTasks > 0 && (
                      <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-700">
                        {completedCount}/{totalTasks} done
                      </span>
                    )}
                  </div>

                  {carePlan.daily_tasks?.length > 0 ? (
                    <ul className="space-y-2">
                      {carePlan.daily_tasks.map((task, index) => {
                        const isCompleted = completedTasks.includes(index);

                        return (
                          <li key={index}>
                            <label
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                                isCompleted
                                  ? "border-green-200 bg-green-50 text-slate-500"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => toggleTask(index, task)}
                                className="mt-1 h-6 w-6 print:hidden"
                              />

                              <span
                                className={`leading-7 ${
                                  isCompleted ? "line-through" : ""
                                }`}
                              >
                                {isCompleted ? "✓ " : ""}
                                {task}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-slate-600">No daily tasks listed.</p>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-2 text-sm font-bold uppercase text-slate-500">
                    Review carefully
                  </p>
                  <h3 className="mb-3 text-2xl font-black">Medications</h3>

                  {carePlan.medications?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-slate-300 text-sm text-slate-600">
                            <th className="py-2 pr-3">Name</th>
                            <th className="py-2 pr-3">Dosage</th>
                            <th className="py-2 pr-3">Frequency</th>
                            <th className="py-2 pr-3">Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {carePlan.medications.map((med, index) => (
                            <tr
                              key={index}
                              className="border-b border-slate-200"
                            >
                              <td className="py-3 pr-3 font-medium">
                                {med.name || "Not specified"}
                              </td>
                              <td className="py-3 pr-3">
                                {med.dosage || "Not specified"}
                              </td>
                              <td className="py-3 pr-3">
                                {med.frequency || "Not specified"}
                              </td>
                              <td className="py-3 pr-3">
                                {med.instructions || "Not specified"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-600">No medications listed.</p>
                  )}
                </section>

                <section className="warning-signs-card rounded-lg border-2 border-red-400 bg-red-50 p-5 text-red-950">
                  <p className="mb-2 text-sm font-bold uppercase text-red-800">
                    Pay attention
                  </p>
                  <h3 className="mb-3 text-2xl font-black text-red-950">
                    Warning Signs
                   </h3>
		   <div className="warning-alert mb-4 rounded-lg border border-red-300 bg-red-100 p-4">
  <p className="font-semibold text-red-900">
    Important: Contact a healthcare provider if any warning signs occur or worsen.
  </p>
</div>

                  {carePlan.warning_signs?.length > 0 ? (
                    <ul className="space-y-2">
                      {carePlan.warning_signs.map((warning, index) => (
                        <li
                          key={index}
                          className="warning-item rounded-lg border border-red-200 bg-white p-4 font-bold leading-7 text-red-900"
                        >
                          {warning}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-red-900">No warning signs listed.</p>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase text-slate-500">
                        Schedule
                      </p>
                      <h3 className="text-2xl font-black">Follow-Ups</h3>
                    </div>

                    {totalFollowUps > 0 && (
                      <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-700">
                        {completedFollowUpCount}/{totalFollowUps} done
                      </span>
                    )}
                  </div>

                  {carePlan.follow_up?.length > 0 ? (
                    <ul className="space-y-2">
                      {carePlan.follow_up.map((item, index) => {
                        const isCompleted = completedFollowUps.includes(index);

                        return (
                          <li key={index}>
                            <label
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                                isCompleted
                                  ? "border-blue-200 bg-blue-50 text-slate-500"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => toggleFollowUp(index, item)}
                                className="mt-1 h-6 w-6 print:hidden"
                              />

                              <span
                                className={`leading-7 ${
                                  isCompleted ? "line-through" : ""
                                }`}
                              >
                                {isCompleted ? "✓ " : ""}
                                {item}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-slate-600">
                      No follow-up actions listed.
                    </p>
                  )}
                </section>

                <section className="rounded-lg border border-purple-200 bg-purple-50 p-5">
                  <p className="mb-2 text-sm font-bold uppercase text-purple-800">
                    Track changes
                  </p>
                  <h3 className="mb-3 text-2xl font-black">
                    Symptoms & Observations
                  </h3>

                  <div className="grid gap-2 sm:grid-cols-2 print:hidden">
                    {presetSymptoms.map((symptom) => {
                      const isLogged = loggedSymptoms.includes(symptom);

                      return (
                        <label
                          key={symptom}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                            isLogged
                              ? "border-purple-300 bg-white text-purple-800"
                              : "border-purple-100 bg-white text-slate-700 hover:bg-purple-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isLogged}
                            onChange={() => toggleSymptom(symptom)}
                            className="h-6 w-6"
                          />
                          <span className="font-bold">{symptom}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row print:hidden">
                    <input
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      placeholder="Add custom symptom or observation"
                      className="min-h-12 flex-1 rounded-lg border border-purple-200 bg-white p-3 text-slate-800 outline-none focus:border-purple-500"
                    />

                    <button
                      onClick={addCustomSymptom}
                      className="min-h-12 rounded-lg bg-purple-700 px-4 py-2 text-sm font-black text-white hover:bg-purple-800"
                    >
                      Add Symptom
                    </button>
                  </div>

                  {loggedSymptoms.length > 0 ? (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-semibold text-purple-800">
                        Logged observations:
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {loggedSymptoms.map((symptom) => (
                          <span
                            key={symptom}
                            className="rounded-full border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-purple-900 shadow-sm"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-slate-600">
                      No symptoms or observations logged yet.
                    </p>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-2 text-sm font-bold uppercase text-slate-500">
                    Write it down
                  </p>
                  <h3 className="mb-3 text-2xl font-black">
                    Caregiver Notes
                  </h3>

                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Example: Mom seemed more confused today or missed morning medication."
                    className="min-h-32 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-blue-500 print:hidden"
                  />

                  <button
                    onClick={addNote}
                    className="mt-3 min-h-12 rounded-lg bg-slate-800 px-4 py-2 text-sm font-black text-white hover:bg-slate-900 print:hidden"
                  >
                    Add Note
                  </button>

                  {notes.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {notes.map((note, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-slate-600">
                      No caregiver notes added yet.
                    </p>
                  )}
                </section>

                <section
                  id="share"
                  className="family-summary-card rounded-lg border border-emerald-200 bg-emerald-50 p-5 print:hidden"
                >
                  <p className="mb-2 text-sm font-bold uppercase text-emerald-800">
                    Share
                  </p>
                  <h3 className="mb-3 text-2xl font-black">
                    Family Care Summary
                  </h3>

                  <p className="mb-4 leading-7 text-slate-700">
                    Create a concise summary that can be shared with family
                    members, backup caregivers, or care team members.
                  </p>

                  <button
                    onClick={copyFamilySummary}
                    className="min-h-12 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800"
                  >
                    Copy Summary
                  </button>

                  {copyMessage && (
                    <p className="mt-3 text-sm font-medium text-emerald-800">
                      {copyMessage}
                    </p>
                  )}
                </section>

                <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                  <p className="mb-2 text-sm font-bold uppercase text-blue-800">
                    History
                  </p>
                  <h3 className="mb-3 text-2xl font-black">
                    Care Timeline
                  </h3>

                  {timeline.length > 0 ? (
                    <div className="space-y-3">
                      {timeline.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-blue-100 bg-white p-3"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            {item.time}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {item.event}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">
                      Timeline events will appear as you complete tasks, follow
                      up actions, log symptoms, ask the assistant, or add notes.
                    </p>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                  <strong>Disclaimer: </strong>
                  {carePlan.disclaimer ||
                    "This tool does not provide medical advice. Contact a licensed healthcare professional for medical concerns."}
                </section>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
