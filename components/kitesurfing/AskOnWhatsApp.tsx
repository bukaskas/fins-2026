import { FaWhatsapp } from "react-icons/fa";
import { WHATSAPP_PHONE } from "@/lib/constants";

/**
 * The action for a price section.
 *
 * Gear Rental and Equipment Storage both used to end at a price list with
 * nothing to do next — the highest-intent, lowest-effort visitor on the page
 * reached exactly what they came for and was offered no way to act on it.
 *
 * WhatsApp is the honest destination rather than a booking form: PRODUCT.md
 * records it as the primary guest channel, and staff confirm and chase there.
 * The number is derived from the single constant, following the pattern already
 * used on /day-use, rather than hardcoding it a fifth time.
 *
 * Deliberately styled in the design system's own filled CTA, not WhatsApp green
 * — the channel is named in the label and drawn in the glyph, so the button does
 * not need to leave the palette to say so.
 */

const WHATSAPP_HREF = "https://wa.me/20" + WHATSAPP_PHONE.replace(/^0/, "");

function AskOnWhatsApp({
  label,
  message,
  children,
}: {
  /** Names the action, e.g. "Ask about gear". */
  label: string;
  /** Prefilled first message, so the guest never starts from a blank thread. */
  message: string;
  /** One line of context above the button. */
  children: React.ReactNode;
}) {
  return (
    <div className="neu-raised-sm flex flex-col gap-5 rounded-3xl p-6 md:p-7">
      <p className="text-[0.85rem] font-[family-name:var(--font-raleway)] font-[400] leading-relaxed text-neu-muted">
        {children}
      </p>
      <a
        href={`${WHATSAPP_HREF}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="neu-btn inline-flex min-h-[44px] w-fit items-center gap-2.5 rounded-2xl bg-neu-primary px-6 text-[0.75rem] font-[700] uppercase tracking-[0.12em] text-neu-fg shadow-neu-sm font-[family-name:var(--font-raleway)]"
      >
        <FaWhatsapp aria-hidden="true" className="h-4 w-4" />
        {label}
      </a>
    </div>
  );
}

export default AskOnWhatsApp;
