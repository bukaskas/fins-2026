"use client";
import Image from "next/image";
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

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

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
    <section id="courses" className="mt-4 w-full ">
      {/*Intro course section */}
      <div className="flex flex-col md:flex-row">
        <IntroCourseSection />
        {/* Beginner course section */}
        <BeginnerCourseSection />
      </div>
      <div className="flex flex-col md:flex-row">
        {/* Advance course section */}
        <AdvanceCourseSection />
        {/* Kids course section */}
        <KidsCourseSection />
      </div>
    </section>
  );
}

export default ContentSection;

function IntroCourseSection() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="beach-photo" className="w-full md:w-[50vw] shrink-0 relative">
        <Image
          src={privateCourse}
          alt="Introduction to kitesurfing course"
          className=" z-5  w-full object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Intro course
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          One session to get a taste of kitesurfing
        </div>
        <Dialog>
          <DialogTrigger className="absolute italic bottom-4 right-4 border-1 border-white bg-stone-600/60 hover:bg-stone-600 text-white px-2 py-1 rounded-full z-10 font-semibold">
            More info
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Interested to try kitesurfing for one session?
              </DialogTitle>
              <DialogDescription asChild>
                <div className="text-left space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Intro course is designed for those that plan to try
                    kitesurfing for one session, to get experience what we need
                    to learn in order to become a kitesurfer.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We will focus on kite control, safety and basic knowledge
                    that we need to know before getting on the board. Main focus
                    is understanding how kite works and safety.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration is <strong className="text-base">2 hours</strong>{" "}
                    done in one session.
                  </p>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">Price:</div>
                    <div className="text-sm">
                      Private: <strong className="text-base">7,500</strong> EGP
                    </div>
                    <div className="text-sm">
                      <span>
                        Group: <strong className="text-base">5,000</strong> EGP
                        per pax
                      </span>
                      , group is 2 to 4 persons
                    </div>
                    <div className="flex justify-end">
                      <Button
                        asChild
                        className="text-center justify-end rounded-full text-xl"
                      >
                        <Link href="/kitesurfing/booking">Book now</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function BeginnerCourseSection() {
  return (
    <div className="flex flex-col md:flex-row  ">
      <div id="beach-photo" className="w-full md:w-[50vw] shrink-0 relative">
        <Image
          src={beginnerPhoto}
          alt="Beginner kitesurfing course"
          className=" z-5  w-full object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Beginner course
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          One session to get a taste of kitesurfing
        </div>
        <Dialog>
          <DialogTrigger className="absolute italic bottom-4 right-4 border-1 border-white bg-stone-600/60 hover:bg-stone-600 text-white px-2 py-1 rounded-full z-10 font-semibold">
            More info
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What is Beginner course? </DialogTitle>
              <DialogDescription asChild>
                <div className="text-left space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You will learn basics of the kite and proceed attempt your
                    first water start with your IKO Instructor. You will now put
                    your skills to the test and experience the full potential of
                    the wind and the kite.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You will learn to use the kite power to body drag in all
                    possible directions, water relaunch your kite, recover your
                    board; and attempt your first rides on the board!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <div className="text-xl font-semibold">Duration:</div>
                    <div className="">
                      Private is <strong className="text-xl">6 hours</strong>
                    </div>
                    <div className=" ">
                      Group is <strong className="text-xl">8 hours</strong>
                    </div>
                    <div className="">
                      Course takes 2 to 3 days to be completed depending on
                      weather and student progress.
                    </div>
                  </p>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">Price:</div>
                    <div className="text-sm">
                      Private: <strong className="text-base">22,000</strong> EGP
                    </div>
                    <div className="text-sm">
                      <span>
                        Group: <strong className="text-base">17,000</strong> EGP
                        per pax
                      </span>
                      , group is 2 to 4 persons
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      asChild
                      className="text-center justify-end rounded-full text-xl"
                    >
                      <Link href="/kitesurfing/booking">Book now</Link>
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
function AdvanceCourseSection() {
  return (
    <div className="flex flex-col md:flex-row  ">
      <div id="beach-photo" className="w-full md:w-[50vw] shrink-0 relative">
        <Image
          src={refresher}
          alt="Beginner kitesurfing course"
          className=" z-5  w-full object-cover"
          sizes="50vw"
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Refresher course
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Finished beginner course but need to refresh your skills?
        </div>
        <Dialog>
          <DialogTrigger className="absolute italic bottom-4 right-4 border-1 border-white bg-stone-600/60 hover:bg-stone-600 text-white px-2 py-1 rounded-full z-10 font-semibold">
            More info
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What is Refresher course? </DialogTitle>
              <DialogDescription asChild>
                <div className="text-left space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Refresher course designed for those who did the course
                    before, but would like to refresh and improve their skills
                    to reach independent level.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We will check your skills and improve them that you can ride
                    and stay safe on your own
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <div className="text-xl font-semibold">Duration:</div>
                    <div className="">
                      <strong className="text-xl">2 hours session</strong>
                    </div>
                  </p>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">Price:</div>
                    <div className="text-sm">
                      Private: <strong className="text-base">7,500</strong> EGP
                    </div>
                    <div className="text-sm">
                      <span>
                        Group: <strong className="text-base">5,000</strong> EGP
                        per pax
                      </span>
                      , group is 2 to 4 persons
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      asChild
                      className="text-center justify-end rounded-full text-xl"
                    >
                      <Link href="https://wa.me/201080500099?text=Hello%2C%0AI%20want%20to%20book%20refresher%20course">
                        Book now
                      </Link>
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
function KidsCourseSection() {
  return (
    <div className="flex flex-col md:flex-row  ">
      <div id="beach-photo" className="w-full md:w-[50vw] shrink-0 relative">
        <Image
          src={kidsCourse}
          alt="Beginner kitesurfing course"
          className="z-5  w-full object-cover"
          sizes="50vw"
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Kids courses
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Special course for kids, ages 6 to 18
        </div>
        <Dialog>
          <DialogTrigger className="absolute italic bottom-4 right-4 border-1 border-white bg-stone-600/60 hover:bg-stone-600 text-white px-2 py-1 rounded-full z-10 font-semibold">
            More info
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kids courses </DialogTitle>
              <DialogDescription asChild>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="">Course</TableHead>
                      <TableHead className="">Time</TableHead>
                      <TableHead className="">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Intro</TableCell>
                      <TableCell>2 hours</TableCell>
                      <TableCell>5,000 EGP</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Private Beginner
                      </TableCell>
                      <TableCell>6 hours</TableCell>
                      <TableCell>15,000 EGP</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Group Beginner
                      </TableCell>
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
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
