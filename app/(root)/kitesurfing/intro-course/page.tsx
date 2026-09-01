import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Intro Kitesurfing Course",
  description:
    "Try kitesurfing with an intro course at Fins — a taster session near Sokhna.",
  image: "/images/hero_images/kitesurfing_desktop2.webp",
  path: "/kitesurfing/intro-course",
});

import introPhoto from "@/public/images/product-2.webp";
import {
  CourseAside,
  CourseFlow,
  CourseHero,
  CourseIntro,
  CourseLayout,
  InfoCard,
} from "@/components/kitesurfing/CourseDetail";

function IntroCoursePage() {
  return (
    <main className="bg-neu-base min-h-screen font-[family-name:var(--font-raleway)] text-neu-fg">
      <CourseHero
        eyebrow="Try it in one session"
        titleLight="Intro"
        titleBold="Session"
        description="A focused two-hour introduction to kitesurfing — safety, kite control, and the knowledge you need before getting on the board."
        image={introPhoto}
        imageAlt="Intro kitesurfing session at Fins"
      />

      <CourseLayout
        aside={
          <CourseAside
            title="Session details"
            rows={[
              { label: "Duration", value: "2 hours" },
              { label: "Format", value: "One session" },
              { label: "Private price", value: "8,500 EGP" },
              { label: "Group price", value: "5,500 EGP per person" },
              { label: "Group size", value: "2 to 4 students" },
            ]}
            note="The intro session is not designed to get you riding the board — its goal is to give you the knowledge and feel needed to decide if you want to continue with a full beginner course."
            course="intro"
            bookLabel="Book intro session"
          />
        }
      >
        <CourseIntro
          eyebrow="Intro Kitesurfing Session"
          title="Try kitesurfing in one focused session."
          description="The intro course is designed for those planning to try kitesurfing for one session — to experience what we need to learn to become a kitesurfer. We focus on kite control, safety, and the basic knowledge required before getting on the board."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard
            title="What you will learn"
            items={[
              "How a kite works and how the wind powers it",
              "Safety systems, self-rescue basics, and wind awareness",
              "Controlled kite flying with the bar on land",
              "First feel of kite power and how to manage it",
              "What to expect if you decide to continue with a full course",
            ]}
          />
          <InfoCard
            title="Who this session is for"
            items={[
              "First-time visitors curious about kitesurfing",
              "Guests with limited time who want a taste before committing",
              "Travelers who want a guided introduction with an instructor",
              "Anyone who wants to know if kitesurfing is right for them",
            ]}
          />
        </div>

        <CourseFlow
          title="How the session flows"
          steps={[
            {
              step: "01",
              title: "Theory & safety",
              description:
                "A short briefing on how the kite works, the wind window, and safety systems before we touch the gear.",
            },
            {
              step: "02",
              title: "Kite control",
              description:
                "Hands-on flying with a training kite, then progressing to a full-size kite under instructor guidance.",
            },
            {
              step: "03",
              title: "Next steps",
              description:
                "A clear picture of where you are and what a full beginner course would add if you decide to continue.",
            },
          ]}
        />
      </CourseLayout>
    </main>
  );
}

export default IntroCoursePage;
