//// filepath: /Users/audriusbksks/Desktop/fins web app/fins-store-v3/app/(root)/users/page.tsx
import { prisma } from "@/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // Only allow admins (adjust roles as you like)
  if (!session || role !== "ADMIN") {
    redirect("/signin");
  }

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" }, // or createdAt: "desc" if you have createdAt
  });

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Users</h1>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Phone</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} className="border-t">
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">{user.name ?? "-"}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2">{user.phone ?? "-"}</td>
                <td className="px-3 py-2">{(user as any).role ?? "-"}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
