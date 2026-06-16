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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [careRecipientName, setCareRecipientName] = useState("");
  const [primaryCaregiver, setPrimaryCaregiver] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [careFocus, setCareFocus] = useState("");
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
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

  const askCareGuide = async () => {
    if (!carePlan) {
      setAssistantAnswer("Please generate a care plan first.");
      return;
    }

    if (!assistantQuestion.trim()) {
      setAssistantAnswer("Please enter a question first.");
      return;
    }

    setAssistantLoading(true);
    setAssistantAnswer("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: assistantQuestion,
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
    question: assistantQuestion,
    answer,
    time: currentTime(),
  },
  ...prev,
]);

addTimelineEvent(`Asked CareGuide AI: ${assistantQuestion}`);
setAssistantQuestion("");
    } catch (error) {
      console.error(error);
      setAssistantAnswer("Unable to contact CareGuide AI. Please try again.");
    } finally {
      setAssistantLoading(false);
    }
  };
 const generateCareStatusReport = async () => {
  setAssistantQuestion(
    "Generate a concise care status report for today. Include completed tasks, remaining tasks, completed follow-up actions, pending follow-up actions, logged symptoms, caregiver notes, and recent timeline activity. Keep it caregiver-friendly and action-oriented."
  );

  setTimeout(() => {
    const button = document.getElementById("ask-careguide-button");
    button?.click();
  }, 100);
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
      await navigator.clipboard.writeText(summary.trim());
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/extract`, {
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

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
            ACL Caregiver AI Challenge MVP
          </p>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            CareGuide AI
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-slate-700">
            Upload discharge instructions, medication lists, or caregiver notes.
            CareGuide AI converts complex care information into a clear,
            caregiver-friendly action plan.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm print:hidden">
            <h2 className="mb-3 text-2xl font-semibold">Upload Document</h2>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center hover:bg-blue-100">
              <div className="mb-3 text-5xl">📄</div>

              <p className="mb-2 text-lg font-semibold text-slate-800">
                Click to choose a file
              </p>

              <p className="mb-4 text-sm text-slate-600">
                Supported files: TXT, PDF, JPG, PNG
              </p>

              <input
                type="file"
                accept=".txt,.pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              {file && (
                <p className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  Selected: {file.name}
                </p>
              )}
            </label>

            <button
              onClick={handleUpload}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 text-base font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Analyzing document..." : "Generate Care Plan"}
            </button>

            {carePlan && (
              <>
                <button
                  onClick={exportCareSummary}
                  className="mt-4 w-full rounded-xl bg-slate-900 px-5 py-3 text-base font-semibold text-white hover:bg-slate-950"
                >
                  📄 Export Care Summary
                </button>

                <button
                  onClick={copyFamilySummary}
                  className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3 text-base font-semibold text-white hover:bg-emerald-800"
                >
                  📋 Copy Family Summary
                </button>
              </>
            )}

            {copyMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {copyMessage}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {carePlan && totalTasks > 0 && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Task progress: {completedCount} of {totalTasks} completed
              </div>
            )}

            {carePlan && totalFollowUps > 0 && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                Follow-up progress: {completedFollowUpCount} of{" "}
                {totalFollowUps} completed
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

          <div className="rounded-2xl bg-white p-6 shadow-sm print:rounded-none print:shadow-none">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Care Plan Dashboard</h2>
                {carePlan && (
                  <p className="mt-1 text-sm text-slate-600">
                    Generated by CareGuide AI
                  </p>
                )}
              </div>

              {carePlan && (
                <button
                  onClick={exportCareSummary}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-950 print:hidden"
                >
                  📄 Export
                </button>
              )}
            </div>

            {!carePlan && !loading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                Your generated caregiver dashboard will appear here after
                uploading a document.
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-800">
                Analyzing the document and building a caregiver-friendly care
                plan...
              </div>
            )}

            {carePlan && (
              <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-2 text-xl font-semibold">📋 Summary</h3>
                  <p className="leading-7 text-slate-700">
                    {carePlan.summary || "Not specified"}
                  </p>
                </section>
           
<section className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 print:hidden">
  <h3 className="mb-3 text-xl font-semibold">👤 Care Recipient Profile</h3>

  <div className="grid gap-3 md:grid-cols-2">
    <input
      value={careRecipientName}
      onChange={(e) => setCareRecipientName(e.target.value)}
      placeholder="Care recipient name"
      className="rounded-xl border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />

    <input
      value={primaryCaregiver}
      onChange={(e) => setPrimaryCaregiver(e.target.value)}
      placeholder="Primary caregiver"
      className="rounded-xl border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />

    <input
      value={emergencyContact}
      onChange={(e) => setEmergencyContact(e.target.value)}
      placeholder="Emergency contact"
      className="rounded-xl border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />

    <input
      value={careFocus}
      onChange={(e) => setCareFocus(e.target.value)}
      placeholder="Care focus, e.g. post-discharge recovery"
      className="rounded-xl border border-cyan-200 bg-white p-3 text-slate-800 outline-none focus:border-cyan-500"
    />
  </div>

  <p className="mt-3 text-sm leading-6 text-slate-600">
    This optional profile helps personalize caregiver summaries and AI assistant responses.
  </p>
</section>

                <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 print:hidden">
                  <h3 className="mb-3 text-xl font-semibold">
                    🤖 Ask CareGuide AI
                  </h3>

                  <p className="mb-4 leading-7 text-slate-700">
                    Ask a caregiver-focused question based on the current care
                    plan, symptoms, notes, and timeline.
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                  <button
                   onClick={generateCareStatusReport}
                   className="rounded-full border border-indigo-300 bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800"
  >
    📊 Generate Care Status Report
  </button>

  {suggestedQuestions.map((question) => (
    <button
      key={question}
      onClick={() => setAssistantQuestion(question)}
      className="rounded-full border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
    >
      {question}
    </button>
  ))}
</div>

                  <textarea
                    value={assistantQuestion}
                    onChange={(e) => setAssistantQuestion(e.target.value)}
                    placeholder="Example: Mom seems more confused today. What should I do?"
                    className="min-h-24 w-full rounded-xl border border-indigo-200 bg-white p-3 text-slate-800 outline-none focus:border-indigo-500"
                  />

                  <button
                    id="ask-careguide-button"
		    onClick={askCareGuide}
                    disabled={assistantLoading}
                    className="mt-3 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold">
                      ✅ Daily Tasks Checklist
                    </h3>

                    {totalTasks > 0 && (
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
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
                                className="mt-1 h-5 w-5 print:hidden"
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

                <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-xl font-semibold">💊 Medications</h3>

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

                <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="mb-3 text-xl font-semibold">
                    ⚠ Warning Signs
                  </h3>
		   <div className="mb-4 rounded-xl border border-red-300 bg-red-100 p-4">
  <p className="font-semibold text-red-900">
    Important: Contact a healthcare provider if any warning signs occur or worsen.
  </p>
</div>

                  {carePlan.warning_signs?.length > 0 ? (
                    <ul className="space-y-2">
                      {carePlan.warning_signs.map((warning, index) => (
                        <li
                          key={index}
                          className="rounded-lg border border-red-200 bg-red-50 p-4 font-medium text-red-900"
                        >
                          {warning}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-600">No warning signs listed.</p>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold">
                      📅 Follow-Up Tracker
                    </h3>

                    {totalFollowUps > 0 && (
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
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
                                className="mt-1 h-5 w-5 print:hidden"
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

                <section className="rounded-xl border border-purple-200 bg-purple-50 p-5">
                  <h3 className="mb-3 text-xl font-semibold">
                    🩺 Symptoms & Observations
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
                            className="h-5 w-5"
                          />
                          <span>{symptom}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row print:hidden">
                    <input
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      placeholder="Add custom symptom or observation"
                      className="flex-1 rounded-xl border border-purple-200 bg-white p-3 text-slate-800 outline-none focus:border-purple-500"
                    />

                    <button
                      onClick={addCustomSymptom}
                      className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
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

                <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-xl font-semibold">
                    📝 Caregiver Notes
                  </h3>

                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Example: Mom seemed more confused today or missed morning medication."
                    className="min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-blue-500 print:hidden"
                  />

                  <button
                    onClick={addNote}
                    className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 print:hidden"
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

                <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 print:hidden">
                  <h3 className="mb-3 text-xl font-semibold">
                    👨‍👩‍👧 Family Care Summary
                  </h3>

                  <p className="mb-4 leading-7 text-slate-700">
                    Create a concise summary that can be shared with family
                    members, backup caregivers, or care team members.
                  </p>

                  <button
                    onClick={copyFamilySummary}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    📋 Copy Summary
                  </button>

                  {copyMessage && (
                    <p className="mt-3 text-sm font-medium text-emerald-800">
                      {copyMessage}
                    </p>
                  )}
                </section>

                <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <h3 className="mb-3 text-xl font-semibold">
                    🕘 Care Timeline
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