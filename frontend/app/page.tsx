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

const presetSymptoms = [
  "Confusion",
  "Fatigue",
  "Dizziness",
  "Pain",
  "Poor appetite",
  "Trouble sleeping",
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [completedFollowUps, setCompletedFollowUps] = useState<number[]>([]);
  const [loggedSymptoms, setLoggedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTime = () => new Date().toLocaleString();

  const addTimelineEvent = (event: string) => {
    setTimeline((prev) => [{ time: currentTime(), event }, ...prev]);
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/extract", {
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
          <div className="rounded-2xl bg-white p-6 shadow-sm">
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

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">Care Plan Dashboard</h2>

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
                                className="mt-1 h-5 w-5"
                              />

                              <span
                                className={`leading-7 ${
                                  isCompleted ? "line-through" : ""
                                }`}
                              >
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

                  {carePlan.warning_signs?.length > 0 ? (
                    <ul className="space-y-2">
                      {carePlan.warning_signs.map((warning, index) => (
                        <li
                          key={index}
                          className="rounded-lg bg-white p-3 text-slate-800"
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
                                className="mt-1 h-5 w-5"
                              />

                              <span
                                className={`leading-7 ${
                                  isCompleted ? "line-through" : ""
                                }`}
                              >
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

                  <div className="grid gap-2 sm:grid-cols-2">
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

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
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

                  {loggedSymptoms.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-semibold text-purple-800">
                        Logged observations:
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {loggedSymptoms.map((symptom) => (
                          <span
                            key={symptom}
                            className="rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-800"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
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
                    className="min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-blue-500"
                  />

                  <button
                    onClick={addNote}
                    className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    Add Note
                  </button>

                  {notes.length > 0 && (
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
                      up actions, log symptoms, or add notes.
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