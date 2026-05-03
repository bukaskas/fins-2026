"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGuest } from "@/lib/actions/user.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function AddGuestDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
  }

  async function handleSubmit() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!email.trim()) { toast.error("Email is required"); return; }
    setSaving(true);
    const result = await createGuest({ name: name.trim(), email: email.trim(), phone: phone.trim() || null });
    setSaving(false);
    if (result.success) {
      toast.success("Guest created");
      setOpen(false);
      reset();
      router.push(`/register?q=${encodeURIComponent(result.user.name ?? result.user.email)}`);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-white border border-[#ece8e3] text-[#1a1614] font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.14em] uppercase font-[700] px-5 py-2.5 rounded-xl hover:bg-[#f5f2ef] transition-colors shrink-0"
      >
        + Add Guest
      </button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-sm rounded-2xl bg-white border border-[#ece8e3] shadow-xl p-0"
        >
          <DialogHeader className="border-[#ece8e3] px-6 pt-6 pb-4">
            <DialogTitle className="text-[1.1rem] font-[700] text-[#1a1614] tracking-normal">
              New Guest
            </DialogTitle>
            <p className="font-[family-name:var(--font-raleway)] text-[0.8rem] text-[#8a8480] mt-0.5">
              Creates a guest account — no email sent
            </p>
          </DialogHeader>

          <div className="px-6 py-4 space-y-3">
            <div className="space-y-1">
              <label className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.12em] uppercase font-[600] text-[#8a8480]">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Al-Rashidi"
                autoFocus
                className="w-full border border-[#ece8e3] rounded-xl px-3.5 py-2.5 text-[0.9rem] text-[#1a1614] bg-white font-[family-name:var(--font-raleway)] focus:outline-none focus:border-[#1a1614] transition-colors placeholder:text-[#c0b8b0]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.12em] uppercase font-[600] text-[#8a8480]">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ahmed@example.com"
                className="w-full border border-[#ece8e3] rounded-xl px-3.5 py-2.5 text-[0.9rem] text-[#1a1614] bg-white font-[family-name:var(--font-raleway)] focus:outline-none focus:border-[#1a1614] transition-colors placeholder:text-[#c0b8b0]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-[family-name:var(--font-raleway)] text-[0.65rem] tracking-[0.12em] uppercase font-[600] text-[#8a8480]">
                Phone <span className="text-[#c0b8b0] font-[400] normal-case tracking-normal">optional</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                placeholder="+20 100 000 0000"
                className="w-full border border-[#ece8e3] rounded-xl px-3.5 py-2.5 text-[0.9rem] text-[#1a1614] bg-white font-[family-name:var(--font-roboto)] tabular-nums focus:outline-none focus:border-[#1a1614] transition-colors placeholder:text-[#c0b8b0]"
              />
            </div>
          </div>

          <DialogFooter className="border-[#ece8e3] px-6 pb-6 pt-4 flex-row gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => { setOpen(false); reset(); }}
              className="flex-1 border border-[#ece8e3] text-[#8a8480] font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[600] py-2.5 rounded-xl hover:bg-[#f5f2ef] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 bg-[#1a1614] text-white font-[family-name:var(--font-raleway)] text-[0.72rem] tracking-[0.1em] uppercase font-[700] py-2.5 rounded-xl hover:bg-[#2a2420] transition-colors disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Guest"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
