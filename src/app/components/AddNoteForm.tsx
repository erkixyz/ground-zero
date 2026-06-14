"use client";

import { createNote } from "@/app/actions";
import { useRef, useTransition } from "react";

export default function AddNoteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createNote(formData);
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-3"
    >
      <h2 className="font-semibold text-white">Lisa märkme</h2>
      <input
        name="title"
        placeholder="Pealkiri"
        required
        disabled={pending}
        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 text-sm placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <textarea
        name="content"
        placeholder="Sisu"
        rows={3}
        required
        disabled={pending}
        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 text-sm placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {pending ? "Salvestan..." : "Lisa märkme"}
      </button>
    </form>
  );
}
