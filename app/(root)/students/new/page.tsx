import { createStudent } from "@/lib/actions/user.actions";

export default function NewStudentPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Add Student</h1>

      <form action={createStudent} className="space-y-3 rounded-md border p-4">
        <div>
          <label className="mb-1 block text-sm">Name</label>
          <input
            name="name"
            type="text"
            placeholder="Full name"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Phone</label>
          <input
            name="phone"
            type="tel"
            placeholder="Phone number (optional)"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Add student
        </button>
      </form>
    </main>
  );
}
