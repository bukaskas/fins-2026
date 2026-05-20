"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteUser } from "@/lib/actions/user.actions";

type Props = {
  userId: string;
  userLabel: string;
};

export function DeleteUserButton({ userId, userLabel }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        toast.success(`Deleted ${userLabel}`);
        setConfirming(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!confirming) {
    return (
      <Button
        variant="link"
        className="text-destructive hover:text-destructive px-2"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? "Deleting…" : "Confirm"}
      </Button>
    </div>
  );
}
