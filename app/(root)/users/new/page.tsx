import Link from "next/link";
import UserCreateForm from "./UserCreateForm";

export default function NewUserPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/users" className="text-sm text-muted-foreground hover:underline">
        ← Users
      </Link>
      <UserCreateForm />
    </main>
  );
}
