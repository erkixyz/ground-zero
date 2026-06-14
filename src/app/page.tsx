import { prisma } from "@/lib/prisma";
import { deleteNote } from "@/app/actions";
import AddNoteForm from "@/app/components/AddNoteForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Ground Zero</h1>
          <p className="text-slate-400">Next.js · PostgreSQL · Prisma 7</p>
          <p className="text-slate-600 text-xs">
            REST API:{" "}
            <a href="/api/notes" className="text-blue-500 hover:text-blue-400 underline">
              /api/notes
            </a>
          </p>
        </div>

        <AddNoteForm />

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              Märkmeid pole. Lisa esimene!
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white truncate">{note.title}</h2>
                  <p className="text-slate-400 mt-1 text-sm">{note.content}</p>
                  <span className="text-slate-600 text-xs mt-2 block">
                    {note.createdAt.toLocaleString("et-EE")}
                  </span>
                </div>
                <form action={deleteNote.bind(null, note.id)}>
                  <button
                    type="submit"
                    className="text-slate-600 hover:text-red-400 transition-colors text-sm px-2"
                  >
                    ✕
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
