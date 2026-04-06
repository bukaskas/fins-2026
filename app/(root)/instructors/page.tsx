import { listInstructors } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function InstructorsPage() {
  const instructors = await listInstructors();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Instructors</h1>
        <Button asChild variant="outline">
          <Link href="/users">Manage via Users</Link>
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        To add or remove an instructor, go to{" "}
        <Link href="/users" className="underline">
          Users
        </Link>{" "}
        and set their role to <strong>INSTRUCTOR</strong>.
      </p>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
            </tr>
          </thead>
          <tbody>
            {instructors.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground">
                  No instructors found. Assign the INSTRUCTOR role to a user.
                </td>
              </tr>
            ) : (
              instructors.map((i) => (
                <tr key={i.id} className="border-b">
                  <td className="px-3 py-2">{i.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Button asChild variant="link">
                      <Link href={`/users/edit/${i.id}`} className="text-blue-500 hover:underline">
                        Edit
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
