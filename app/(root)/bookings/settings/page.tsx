import { readAutoConfirmSetting } from "@/lib/actions/settings.actions";
import SkipReviewSetting from "./SkipReviewSetting";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

async function BookingSettingsPage() {
  const autoConfirm = await readAutoConfirmSetting();

  return (
    <div className="min-h-screen bg-paper [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-ink">
      <div className="bg-white border-b border-paper-line">
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-6 sm:px-6 sm:pt-8 sm:pb-8">
          <Link
            href="/bookings/dashboard"
            className="inline-flex min-h-11 items-center gap-1.5 text-[0.75rem] tracking-[0.14em] uppercase font-[family-name:var(--font-raleway)] font-[600] text-ink-muted hover:text-ink transition-colors duration-150"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-raleway)] text-[1.75rem] sm:text-[2rem] font-[600] tracking-[-0.02em] text-ink leading-tight">
            Booking settings
          </h1>
          <p className="mt-1 font-[family-name:var(--font-raleway)] text-[0.875rem] text-ink-muted leading-[1.5]">
            These change how every future booking behaves, not the ones
            already made.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {autoConfirm.success ? (
          <SkipReviewSetting initial={autoConfirm.enabled} />
        ) : (
          <div
            role="alert"
            className="flex items-start gap-3 border border-alert-line bg-alert-bg px-5 py-4 font-[family-name:var(--font-raleway)]"
          >
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-alert-icon"
              aria-hidden="true"
            />
            <p className="text-[0.875rem] leading-[1.5] text-alert-ink">
              <span className="font-[700]">
                Couldn’t load “Skip review for new customers”.
              </span>{" "}
              Its current value is unknown, so it can’t be changed right now.{" "}
              <Link
                href="/bookings/settings"
                className="font-[700] underline underline-offset-2 hover:text-ink"
              >
                Reload
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingSettingsPage;
