import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Refresher Kitesurfing Course",
  description:
    "Get back on the water with a refresher course at Fins near Sokhna.",
  image: "/images/kitesurfing/refresher.webp",
  path: "/kitesurfing/refresher-course",
});

import refresherPhoto from "@/public/images/kitesurfing/refresher.webp";
import {
  CourseAside,
  CourseFlow,
  CourseHero,
  CourseIntro,
  CourseLayout,
  InfoCard,
} from "@/components/kitesurfing/CourseDetail";

function RefresherCoursePage() {
  return (
    <main className="bg-neu-base min-h-screen font-[family-name:var(--font-raleway)] text-neu-fg">
      <CourseHero
        eyebrow="Get back on the water"
        titleLight="Refresher"
        titleBold="Course"
        description="Refresh the skills from your last course and keep progressing toward riding independently — controlling your speed and riding upwind."
        image={refresherPhoto}
        imageAlt="Refresher kitesurfing course at Fins"
      />

      <CourseLayout
        aside={
          <CourseAside
            title="Course details"
            rows={[
              { label: "Duration", value: "2 hours" },
              { label: "Format", value: "One session" },
              { label: "Private price", value: "8,500 EGP" },
              { label: "Group price", value: "5,500 EGP per person" },
              { label: "Group size", value: "2 to 4 students" },
            ]}
            note="We check your current skills and work on exactly what you need to ride safely and independently — the pace depends on wind conditions and where you are in your progression."
            course="refresher"
            bookLabel="Book refresher course"
          />
        }
      >
        <CourseIntro
          eyebrow="Refresher Kitesurfing Course"
          title="Pick up where you left off and ride independently."
          description="The refresher course is for riders who have already taken a course before. We refresh the last skills you worked on, then continue your progress toward the independent skills that let you ride on your own — like controlling your speed and riding upwind."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard
            title="What you will work on"
            items={[
              "Refresh the skills you covered in your last course",
              "Confident water starts in both directions",
              "Controlling your speed and managing kite power",
              "Riding upwind to stay in your starting area",
              "Building the independence to ride safely on your own",
            ]}
          />
          <InfoCard
            title="Who this course is for"
            items={[
              "Riders who completed a beginner course before",
              "Anyone returning after a break who wants to regain confidence",
              "Students close to riding independently who need final polish",
              "Kiters who want focused coaching on speed and upwind riding",
            ]}
          />
        </div>

        <CourseFlow
          title="How the course flows"
          steps={[
            {
              step: "01",
              title: "Skill check",
              description:
                "We assess your current level and refresh the last skills you worked on to get you back in the flow.",
            },
            {
              step: "02",
              title: "Speed & control",
              description:
                "Practice managing kite power and controlling your speed so your rides become smooth and consistent.",
            },
            {
              step: "03",
              title: "Riding upwind",
              description:
                "Work on riding upwind and the independent skills you need to ride safely on your own.",
            },
          ]}
        />
      </CourseLayout>
    </main>
  );
}

export default RefresherCoursePage;
