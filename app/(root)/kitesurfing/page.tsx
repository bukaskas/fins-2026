import Image from "next/image";
import heroKiteImage from "@/public/images/product-1.webp";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hash, Timer, User, UserIcon } from "lucide-react";
import privateCourse from "@/public/images/product-2.webp";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
function KitesurfingPage() {
  return (
    <>
      <HeroSection />
      <ContentSection />
    </>
  );
}

export default KitesurfingPage;

function HeroSection() {
  return (
    <div>
      <Image
        src={heroKiteImage}
        alt="Kitesurfing"
        className="absolute inset-0 -z-10 min-h-150 max-h-150 object-cover"
        priority
      />
      <h4 className="text-center text-white font-semibold mt-100 text-4xl font-[family-name:var(--font-raleway)] ">
        Kitesurfing lessons
      </h4>
    </div>
  );
}

function ContentSection() {
  return (
    <section className="mt-4 flex flex-wrap w-full">
      {/*Intro course section */}
      <div className="flex flex-col md:flex-row  gap-6 max-w-6xl mb-4 transition-all duration-300 ease-in">
        <div className=" shrink-0 sm:max-w-lg lg:max-w-xl">
          <Image src={privateCourse} alt="Intro Course" priority />
        </div>
        <div className="font-[family-name:var(--font-raleway)] transition-all duration-300 ease-in">
          <div className="w-full text-center text-2xl mb-4">
            Intro kitesurfing course
          </div>
          <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg mx-4 font-semibold ">
                What is Intro course?{" "}
              </AccordionTrigger>
              <AccordionContent className="transition-all duration-300 ease-in">
                <div className=" mx-12 mb-2">
                  Intro course is designed for those that plan to try
                  kitesurfing for one session, to get experience what we need to
                  learn in order to become a kitesurfer.
                </div>
                <div className=" mx-12 mb-2">
                  We will focus on kite control, safety and basic knowledge that
                  we need to know before getting on the board. Main focus is
                  understanding how kite works and safety.
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg mx-4 font-semibold">
                What is duration of the course?{" "}
              </AccordionTrigger>
              <AccordionContent>
                <div className=" mx-12 mb-2">
                  Duration is <strong className="text-xl">2 hours</strong> done
                  in one session.
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex flex-col">
            <div className="mx-12 mb-2">
              Private: <strong className="text-xl">7,500</strong> EGP
            </div>
            <div className="mx-12 mb-2">
              <span>
                Group: <strong className="text-xl">5,000</strong> EGP per pax
              </span>
              , group is 2 to 4 persons
            </div>
          </div>
        </div>
      </div>
      {/* Beginner course section */}
      <div className="flex flex-col md:flex-row gap-6 max-w-6xl">
        <div className=" shrink-0 sm:max-w-lg lg:max-w-xl">
          <Image src={privateCourse} alt="Intro Course" priority />
        </div>
        <div className="font-[family-name:var(--font-raleway)]">
          <div className="w-full text-center text-2xl mb-4">
            Beginner kitesurfing course
          </div>
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="item-1"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg mx-4 font-semibold">
                What is Beginner course?{" "}
              </AccordionTrigger>
              <AccordionContent className="mx-12 mb-2">
                You will learn basics of the kite and proceed attempt your first
                water start with your IKO Instructor. You will now put your
                skills to the test and experience the full potential of the wind
                and the kite. You will learn to use the kite power to body drag
                in all possible directions, water relaunch your kite, recover
                your board; and attempt your first rides on the board!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg mx-4 font-semibold">
                What is duration of the course?{" "}
              </AccordionTrigger>
              <AccordionContent>
                <div className=" mx-12 mb-2">
                  Private is <strong className="text-xl">6 hours</strong>
                </div>
                <div className=" mx-12 mb-2">
                  Group is <strong className="text-xl">8 hours</strong>
                </div>
                <div className=" mx-12 mb-2">
                  Course takes 2 to 3 days to be completed depending on weather
                  and student progress.
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex flex-col">
            <div className="mx-12 mb-2">
              Private: <strong className="text-xl">22,000</strong> EGP
            </div>
            <div className="mx-12 mb-2">
              <span>
                Group: <strong className="text-xl">17,000</strong> EGP per pax
              </span>
              , group is 2 to 4 persons
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BeginnerCourses() {
  return (
    <section id="courses">
      <div>Beginner courses</div>
      <p>
        Beginner courses are designed for those that didn't try kitesurfing
        before. We will start from the basics and get you on the board. If you
        like the experience, then check our advance courses
      </p>
      <Table>
        <TableHeader>
          <TableRow className="sm:text-xl">
            <TableHead>Course name</TableHead>
            <TableHead>
              <span className="flex items-center gap-0">
                <Timer className="h-4 " /> Time
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap ">
                <Hash className="h-4" />
                <User className="h-5" />
              </span>
            </TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    </section>
  );
}
