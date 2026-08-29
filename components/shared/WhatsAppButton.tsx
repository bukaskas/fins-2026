"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";

import { isStaffPath } from "@/lib/routes";

const contacts = [
  {
    label: "Day Use reservations",
    detail: "+201222144388",
    href: "https://wa.me/201222144388",
  },
  {
    label: "Kitesurfing reservations",
    detail: "+201121105926",
    href: "https://wa.me/201121105926",
  },
];

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Guest widget only. On back-office pages it floats over fixed action bars
  // (it covered half the desk view's check-in button) and offers a member of
  // the public a way to contact reception, which reception does not need.
  if (isStaffPath(pathname)) return null;

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div
          id="whatsapp-contact-options"
          className="absolute bottom-full right-0 mb-3 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
        >
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="font-semibold text-neutral-900">WhatsApp reservations</p>
            <p className="text-sm text-neutral-500">Choose who you would like to contact</p>
          </div>

          <div className="p-2">
            {contacts.map((contact) => (
              <a
                key={contact.label}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-green-50 focus-visible:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                onClick={() => setIsOpen(false)}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <FaWhatsapp size={22} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-neutral-900">{contact.label}</span>
                  <span className="block text-sm text-neutral-500">{contact.detail}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center justify-center rounded-full bg-green-500 p-4 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
        aria-label={isOpen ? "Close WhatsApp reservation options" : "Open WhatsApp reservation options"}
        aria-expanded={isOpen}
        aria-controls="whatsapp-contact-options"
      >
        <FaWhatsapp size={32} aria-hidden="true" />
      </button>
    </div>
  );
}
