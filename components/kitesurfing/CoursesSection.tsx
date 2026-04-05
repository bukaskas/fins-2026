"use client";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import privateCourse from "@/public/images/product-2.webp";
import beginnerPhoto from "@/public/images/webphotos_fins/webphoto_29.webp";
import refresher from "@/public/images/kitesurfing/refresher.webp";
import kidsCourse from "@/public/images/kitesurfing/kids_course.webp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type CourseCardProps = {
  title: string;
  subtitle: string;
  image: StaticImageData;
  dialogTitle?: string;
  dialogContent?: React.ReactNode;
  moreInfoHref?: string;
  priority?: boolean;
};

const moreInfoClass =
  "absolute italic bottom-4 right-4 border border-white bg-stone-600/60 hover:bg-stone-600 text-white px-2 py-1 rounded-full z-10 font-semibold";

function CourseCard({
  title,
  subtitle,
  image,
  dialogTitle,
  dialogContent,
  moreInfoHref,
  priority = false,
}: CourseCardProps) {
  return (
    <div className="relative">
      <Image
        src={image}
        alt={title}
        className="w-full object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={priority}
      />
      <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
        {title}
      </div>
      <div className="absolute bottom-[8%] z-10 left-4 text-white italic">
        {subtitle}
      </div>
      {moreInfoHref ? (
        <Link href={moreInfoHref} className={moreInfoClass}>
          More info
        </Link>
      ) : (
        <Dialog>
          <DialogTrigger className={moreInfoClass}>More info</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription asChild>
                <div>{dialogContent}</div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

const BOOKING_HREF = "/kitesurfing/booking";

const courses: CourseCardProps[] = [
  {
    title: "Intro course",
    subtitle: "One session to get a taste of kitesurfing",
    image: privateCourse,
    priority: true,
    dialogTitle: "Interested to try kitesurfing for one session?",
    dialogContent: (
      <div className="text-left space-y-4">
        <p className="text-sm text-muted-foreground">
          Intro course is designed for those that plan to try kitesurfing for
          one session, to get experience what we need to learn in order to
          become a kitesurfer.
        </p>
        <p className="text-sm text-muted-foreground">
          We will focus on kite control, safety and basic knowledge that we need
          to know before getting on the board. Main focus is understanding how
          kite works and safety.
        </p>
        <p className="text-sm text-muted-foreground">
          Duration is <strong className="text-base">2 hours</strong> done in
          one session.
        </p>
        <div className="space-y-2">
          <div className="text-lg font-semibold">Price:</div>
          <div className="text-sm">
            Private: <strong className="text-base">7,500</strong> EGP
          </div>
          <div className="text-sm">
            Group: <strong className="text-base">5,000</strong> EGP per pax,
            group is 2 to 4 persons
          </div>
          <div className="flex justify-end">
            <Button asChild className="rounded-full text-xl">
              <Link href={BOOKING_HREF}>Book now</Link>
            </Button>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Beginner course",
    subtitle: "Learn to kite and ride the board",
    image: beginnerPhoto,
    priority: true,
    moreInfoHref: "/kitesurfing/beginner-course",
  },
  {
    title: "Refresher course",
    subtitle: "Finished beginner course but need to refresh your skills?",
    image: refresher,
    dialogTitle: "What is Refresher course?",
    dialogContent: (
      <div className="text-left space-y-4">
        <p className="text-sm text-muted-foreground">
          Refresher course designed for those who did the course before, but
          would like to refresh and improve their skills to reach independent
          level.
        </p>
        <p className="text-sm text-muted-foreground">
          We will check your skills and improve them so that you can ride and
          stay safe on your own.
        </p>
        <div className="text-sm text-muted-foreground">
          <div className="text-xl font-semibold">Duration:</div>
          <div>
            <strong className="text-xl">2 hours session</strong>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-lg font-semibold">Price:</div>
          <div className="text-sm">
            Private: <strong className="text-base">7,500</strong> EGP
          </div>
          <div className="text-sm">
            Group: <strong className="text-base">5,000</strong> EGP per pax,
            group is 2 to 4 persons
          </div>
        </div>
        <div className="flex justify-end">
          <Button asChild className="rounded-full text-xl">
            <Link href={BOOKING_HREF}>Book now</Link>
          </Button>
        </div>
      </div>
    ),
  },
  {
    title: "Kids courses",
    subtitle: "Special course for kids, ages 6 to 18",
    image: kidsCourse,
    dialogTitle: "Kids courses",
    dialogContent: (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Intro</TableCell>
              <TableCell>2 hours</TableCell>
              <TableCell>5,000 EGP</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Private Beginner</TableCell>
              <TableCell>6 hours</TableCell>
              <TableCell>15,000 EGP</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Group Beginner</TableCell>
              <TableCell>8 hours</TableCell>
              <TableCell>11,250 EGP</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Refresher</TableCell>
              <TableCell>2 hours</TableCell>
              <TableCell>5,000 EGP</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="flex justify-end">
          <Button asChild className="rounded-full text-xl">
            <Link href={BOOKING_HREF}>Book now</Link>
          </Button>
        </div>
      </div>
    ),
  },
];

function ContentSection() {
  useGSAP(() => {
    gsap.from("#courses", {
      scrollTrigger: {
        trigger: "#courses",
        toggleActions: "restart none none none",
        end: "top 75%",
        scrub: 1,
      },
      y: 200,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
    });
  });

  return (
    <section id="courses" className="mt-4 w-full grid grid-cols-1 md:grid-cols-2">
      {courses.map((course) => (
        <CourseCard key={course.title} {...course} />
      ))}
    </section>
  );
}

export default ContentSection;
