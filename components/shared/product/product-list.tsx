"use client";

import Image from "next/image";
import Link from "next/link";

import privateCourse from "@/public/images/fins-private-lesson.webp";
import dayuseintro from "@/public/images/hero_images/dayuse_intro.webp";
import restaurantPhoto from "@/public/images/webphotos_fins/webphoto_17.webp";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const services = [
  {
    id: "kitesurf",
    index: "01",
    accent: "#38bdf8",
    label: "Kitesurfing · Sokhna",
    headline: ["Ride", "the Wind"],
    body: "Learn to kitesurf on a sheltered, waist-deep lagoon just a short drive from Cairo. IKO-certified instructors, sandy flats, and a vibe that keeps you coming back.",
    bullets: [
      "Sandy lagoon, waist-deep water",
      "IKO-certified instructors",
      "Gear & food on-site",
    ],
    cta: { label: "Book a Course", href: "/kitesurfing" },
    image: privateCourse,
    imageAlt: "Kitesurfing lesson at Fins, Sokhna",
    reverse: false,
  },
  {
    id: "dayuse",
    index: "02",
    accent: "#fbbf24",
    label: "Day Use · Beach Club",
    headline: ["Beach", "Bliss"],
    body: "A protected lagoon, sun loungers, and the Red Sea stretching out in front of you. Kids swim safely while you watch kites arc overhead with a cold drink in hand.",
    bullets: [
      "Lagoon swimming & sunbeds",
      "Safe shallow water for kids",
      "Restaurant & lounge on-site",
    ],
    cta: { label: "Plan Your Day", href: "/day-use" },
    image: dayuseintro,
    imageAlt: "Day use at Fins beach club, Sokhna",
    reverse: true,
  },
  {
    id: "restaurant",
    index: "03",
    accent: "#fb923c",
    label: "Restaurant · By the Sea",
    headline: ["Dine", "Seaside"],
    body: "Sit back with a clear Red Sea view and food worth lingering over. Stone-baked pizza, fresh pasta, juicy burgers — simple things done well, right on the water.",
    bullets: [
      "Stone-baked Italian pizza",
      "Classic pasta & burgers",
      "Open all day",
    ],
    cta: { label: "See the Menu", href: "/restaurant" },
    image: restaurantPhoto,
    imageAlt: "Beachside dining at Fins restaurant, Sokhna",
    reverse: false,
  },
];

function ProductList({ title }: { title?: string }) {
  useGSAP(() => {
    services.forEach(({ id, reverse }) => {
      // Image: cinematic scale-in while scrolling into view
      gsap.fromTo(
        `#${id}-img`,
        { scale: 1.09, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: `#${id}-photo`,
            start: "top 88%",
            end: "top 30%",
            scrub: 1.8,
          },
        }
      );

      // Text: slide in from the opposite edge
      gsap.fromTo(
        `#${id}-text`,
        { x: reverse ? -55 : 55, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: `#${id}-text`,
            start: "top 85%",
            end: "top 48%",
            scrub: 1.2,
          },
        }
      );
    });
  }, []);

  return (
    <section className="bg-white">
      {/* ── Section header ── */}
      <div className="flex flex-col items-center pt-24 pb-20 px-6 text-center">
        <span className="text-[0.58rem] tracking-[0.45em] uppercase text-gray-400 font-[family-name:var(--font-raleway)] font-[400] mb-6">
          Fins · Sokhna Red Sea
        </span>
        <h2 className="font-[family-name:var(--font-raleway)] leading-none mb-6">
          <span className="block text-[clamp(2.6rem,5.5vw,5rem)] font-[100] tracking-[-0.02em] text-gray-900 leading-[0.92]">
            Everything
          </span>
          <span className="block text-[clamp(2.6rem,5.5vw,5rem)] font-[800] tracking-[-0.02em] text-gray-900 leading-[0.92]">
            in one place
          </span>
        </h2>
        <div className="w-8 h-px bg-gray-200 mb-6" />
        <p className="text-gray-400 text-sm font-[300] font-[family-name:var(--font-raleway)] max-w-[18rem] leading-relaxed">
          Three experiences, one destination — minutes from Cairo on the Red Sea.
        </p>
      </div>

      {/* ── Service rows ── */}
      <div>
        {services.map(
          ({ id, index, accent, label, headline, body, bullets, cta, image, imageAlt, reverse }) => (
            <div
              key={id}
              className={`relative flex flex-col border-t border-gray-100 overflow-hidden ${
                reverse ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              {/* Ghost index number */}
              <span
                aria-hidden
                className="absolute select-none pointer-events-none font-[family-name:var(--font-raleway)] font-[100] leading-none text-black/[0.038] z-[1]"
                style={{
                  fontSize: "clamp(9rem,19vw,17rem)",
                  top: "-0.14em",
                  ...(reverse ? { right: "-0.06em" } : { left: "-0.06em" }),
                }}
              >
                {index}
              </span>

              {/* ── Photo panel ── */}
              <div
                id={`${id}-photo`}
                className="relative md:w-[58%] shrink-0 min-h-[58vw] md:min-h-[82vh] overflow-hidden"
              >
                <div id={`${id}-img`} className="absolute inset-0">
                  <Image
                    src={image}
                    alt={imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 58vw"
                  />
                </div>
                {/* Edge gradient toward text */}
                <div
                  className={`absolute inset-y-0 w-24 pointer-events-none z-10 ${
                    reverse
                      ? "left-0 bg-gradient-to-r from-white/8 to-transparent"
                      : "right-0 bg-gradient-to-l from-white/8 to-transparent"
                  }`}
                />
              </div>

              {/* ── Text panel ── */}
              <div
                id={`${id}-text`}
                className={`relative z-10 flex flex-col justify-center px-8 py-16 md:py-24 md:px-14 lg:px-20 ${
                  reverse ? "md:items-end md:text-right" : ""
                }`}
              >
                {/* Eyebrow */}
                <div
                  className="flex items-center gap-2.5 mb-7"
                  style={{
                    justifyContent: reverse ? "flex-end" : "flex-start",
                  }}
                >
                  <span
                    className="h-px w-6 shrink-0"
                    style={{ background: accent }}
                  />
                  <span
                    className="text-[0.58rem] tracking-[0.35em] uppercase font-[family-name:var(--font-raleway)] font-[500]"
                    style={{ color: accent }}
                  >
                    {label}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="font-[family-name:var(--font-raleway)] leading-none mb-8">
                  <span className="block text-[clamp(3rem,6.5vw,6rem)] font-[100] tracking-[-0.02em] text-gray-900 leading-[0.88]">
                    {headline[0]}
                  </span>
                  <span
                    className="block text-[clamp(3rem,6.5vw,6rem)] font-[800] tracking-[-0.02em] leading-[0.88]"
                    style={{ color: accent }}
                  >
                    {headline[1]}
                  </span>
                </h3>

                {/* Divider */}
                <div
                  className="h-px w-10 bg-gray-200 mb-7"
                  style={{ marginLeft: reverse ? "auto" : undefined }}
                />

                {/* Body */}
                <p
                  className="text-gray-500 text-[0.88rem] leading-relaxed font-[family-name:var(--font-raleway)] font-[300] mb-7 max-w-[21rem]"
                  style={{
                    marginLeft: reverse ? "auto" : undefined,
                  }}
                >
                  {body}
                </p>

                {/* Bullets */}
                {bullets && (
                  <ul
                    className="mb-10 flex flex-col gap-2"
                    style={{ alignItems: reverse ? "flex-end" : "flex-start" }}
                  >
                    {bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-2 text-[0.73rem] tracking-wide text-gray-400 font-[family-name:var(--font-raleway)] font-[300]"
                        style={{
                          flexDirection: reverse ? "row-reverse" : "row",
                        }}
                      >
                        <span
                          className="w-[5px] h-[5px] rounded-full shrink-0"
                          style={{ background: accent }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <Link
                  href={cta.href}
                  className="group inline-flex items-center gap-2.5 text-[0.67rem] tracking-[0.22em] uppercase font-[family-name:var(--font-raleway)] font-[600] transition-opacity duration-200 hover:opacity-70"
                  style={{
                    color: accent,
                    alignSelf: reverse ? "flex-end" : "flex-start",
                  }}
                >
                  {cta.label}
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default ProductList;
