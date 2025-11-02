import React, { useEffect, useState, useCallback } from "react";
import StatusDropdown from "./StatusDropdown";

const LS_CUSTOM_TAGS = "cm_custom_tags_v1";

export default function TaskForm({
  data,
  setData,
  error,
  onSubmit,
  onCancel,
  isEditing,
}) {
  const set = useCallback((name, value) => {
    setData((p) => ({ ...p, [name]: value }));
  }, [setData]);

  // Set default start date to today when creating a new task
  useEffect(() => {
    if (!isEditing && !data.startDate) {
      const today = new Date().toISOString().split('T')[0];
      set('startDate', today);
    }
  }, [isEditing, data.startDate, set]); // Dependencies properly declared

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  // Predefined base tags
  const baseTags = ["Projects", "Personal", "Deadline", "Family"];

  // Suggested tags for autocomplete
  const suggestedTags = [
    ...baseTags,
    "Exam",
    "Homework",
    "Group Work",
    "Presentation",
    "Financial",
    "Relationship",
    "Health",
    "Social",
    "Study",
    "Assignment",
    "Extracurricular",
    "Work",
    "Travel",
    "Sports",
    "Time Management",
    "Procrastination",
    "Peer Pressure",
    "Academic Pressure",
  ];

  // Custom tags (persisted in localStorage)
  const [customTags, setCustomTags] = useState(() => {
    const saved = localStorage.getItem(LS_CUSTOM_TAGS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(LS_CUSTOM_TAGS, JSON.stringify(customTags));
  }, [customTags]);

  const tagOptions = [...new Set([...baseTags, ...customTags])];

  // Selected tags for the task
  const [selectedTags, setSelectedTags] = useState(data.tags || []);

  // Keep parent data.tags in sync
  useEffect(() => {
    set("tags", selectedTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags]);

  // Keep local selectedTags in sync when editing a different task
  useEffect(() => {
    setSelectedTags(data.tags || []);
  }, [data.tags]);

  // Adding new tag
  const [newTag, setNewTag] = useState("");

  const addCustomTag = () => {
    const t = newTag.trim().slice(0, 24);
    if (!t || tagOptions.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    setCustomTags((prev) => [...prev, t]);
    setSelectedTags((prev) => [...prev, t]);
    setNewTag("");
  };

  // Removing custom tag
  const removeCustomTag = (t) => {
    setCustomTags((prev) => prev.filter((x) => x !== t));
    setSelectedTags((prev) => prev.filter((x) => x !== t));
  };

  // Toggle tag selection
  const toggleTag = (t) => {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white text-black">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <div className="mt-1.5">
          <input
            id="title"
            name="title"
            value={data.title}
            onChange={(e) => set("title", e.target.value)}
            required
            minLength={3}
            className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm focus:border-[#b7a42f] focus:ring-1 focus:ring-[#b7a42f] sm:text-sm"
            placeholder="e.g., Prepare weekly report"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <div className="mt-1.5">
            <StatusDropdown
              value={data.status === "missing" || data.status === "done_late" ? "todo" : data.status}
              onChange={(s) => set("status", s)}
              className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm focus:border-[#b7a42f] focus:ring-1 focus:ring-[#b7a42f] sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <div className="mt-1.5">
            <select
              id="priority"
              name="priority"
              value={data.priority}
              onChange={(e) => set("priority", e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm focus:border-[#b7a42f] focus:ring-1 focus:ring-[#b7a42f] sm:text-sm"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
            <p className="text-xs text-gray-400 mt-1">Select Start Date</p>
          <div className="mt-1.5">
            <input
              id="startDate"
              type="date"
              name="startDate"
              value={data.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm focus:border-[#b7a42f] focus:ring-1 focus:ring-[#b7a42f] sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
            <p className="text-xs text-gray-400 mt-1">Select Due Date</p>
          <div className="mt-1.5">
            <input
              id="dueDate"
              type="date"
              name="dueDate"
              value={data.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm focus:border-[#b7a42f] focus:ring-1 focus:ring-[#b7a42f] sm:text-sm"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1.5">
            <textarea
              id="description"
              name="description"
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm focus:border-[#b7a42f] focus:ring-1 focus:ring-[#b7a42f] sm:text-sm resize-y"
              placeholder="Notes, links, acceptance criteria…"
            />
          </div>
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Stressor Tags</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {tagOptions.map((t) => {
            const active = selectedTags.includes(t);
            const isCustom = customTags.includes(t);
            return (
              <span
                key={t}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition ${
                  active
                    ? "border-[#b7a42f] bg-[#b7a42f]/10 text-[#b7a42f]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <button type="button" onClick={() => toggleTag(t)} className="focus:outline-none">
                  {t}
                </button>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => removeCustomTag(t)}
                    className="ml-2 flex h-4 w-4 items-center justify-center text-current hover:opacity-70 focus:outline-none"
                    aria-label={`Delete ${t}`}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            );
          })}
        </div>
        <div className="mt-3 flex gap-3">
          <input
            list="tag-suggestions"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            placeholder="Add new stressor (e.g., Exam)"
            className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm focus:border-[#b7a42f] focus:ring-1 focus:ring-[#b7a42f] sm:text-sm"
            maxLength={24}
          />
          <datalist id="tag-suggestions">
            {suggestedTags
              .filter((sug) => !tagOptions.includes(sug))
              .map((sug) => (
                <option key={sug} value={sug} />
              ))}
          </datalist>
          <button
            type="button"
            onClick={addCustomTag}
            className="whitespace-nowrap rounded-md bg-[#b7a42f] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a09228] focus:outline-none focus:ring-2 focus:ring-[#b7a42f] focus:ring-offset-2"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b7a42f] focus:ring-offset-2"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-[#b7a42f] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a09228] focus:outline-none focus:ring-2 focus:ring-[#b7a42f] focus:ring-offset-2"
        >
          {isEditing ? "Save Changes" : "Add Task"}
        </button>
      </div>
    </form>
  );
}
