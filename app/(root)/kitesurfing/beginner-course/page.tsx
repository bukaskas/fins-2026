import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Beginner Kitesurfing Course",
  description:
    "Start kitesurfing from scratch at Fins — a beginner course on safe, flat water.",
  image: "/images/hero_images/kitesurfing_desktop2.webp",
  path: "/kitesurfing/beginner-course",
});

import beginnerPhoto from "@/public/images/webphotos_fins/webphoto_29.webp";
import {
  CourseAside,
  CourseFlow,
  CourseHero,
  CourseIntro,
  CourseLayout,
  InfoCard,
} from "@/components/kitesurfing/CourseDetail";

function BeginnerCoursePage() {
  return (
    <main className="bg-neu-base min-h-screen font-[family-name:var(--font-raleway)] text-neu-fg">
      <CourseHero
        eyebrow="Learn from zero"
        titleLight="Beginner"
        titleBold="Course"
        description="A structured first step into kitesurfing with focused coaching, safety-first progression, and enough water time to start riding."
        image={beginnerPhoto}
        imageAlt="Beginner kitesurfing lesson at Fins"
      />

      <CourseLayout
        aside={
          <CourseAside
            title="Course details"
            rows={[
              { label: "Private duration", value: "6 hours" },
              { label: "Group duration", value: "8 hours" },
              { label: "Course length", value: "2 to 3 days" },
              { label: "Private price", value: "25,500 EGP" },
              { label: "Group price", value: "22,000 EGP per person" },
              { label: "Group size", value: "2 to 4 students" },
            ]}
            note="The exact pace depends on wind conditions and student progress. The goal is not to rush through the hours, but to build the right habits and confidence step by step."
            course="beginner"
            bookLabel="Book beginner course"
          />
        }
      >
        <CourseIntro
          eyebrow="Beginner Kitesurfing Course"
          title="Build the skills to get your first rides."
          description="The beginner course is aimed at helping students experience their first water starts. It is the best option for anyone who wants to get the feeling of getting on the board and starting their first rides with the support of an instructor."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard
            title="What you will learn"
            items={[
              "Kite setup, safety systems, and wind awareness",
              "Kite control, and how to move with the kite",
              "Body dragging skills",
              "Water relaunch and board recovery",
              "First board rides and water start practice",
            ]}
          />
          <InfoCard
            title="Who this course is for"
            items={[
              "First-time students with no previous experience",
              "Guests who want a structured multi-session program",
              "Riders who prefer close coaching before going solo",
              "Friends or couples who want to learn together in a group",
            ]}
          />
        </div>

        <CourseFlow
          title="How the course flows"
          steps={[
            {
              step: "01",
              title: "Ground skills",
              description:
                "Start with safety, equipment handling, and controlled kite flying on land.",
            },
            {
              step: "02",
              title: "Water control",
              description:
                "Practice body dragging, relaunching the kite, and using kite power efficiently in the water.",
            },
            {
              step: "03",
              title: "First rides",
              description:
                "Progress to board starts and short rides with direct instructor feedback.",
            },
          ]}
        />
      </CourseLayout>
    </main>
  );
}

export default BeginnerCoursePage;
