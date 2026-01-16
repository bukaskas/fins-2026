"use client";

import Image from "next/image";

import privateCourse from "@/public/images/fins-private-lesson.webp";
import dayuseintro from "@/public/images/hero_images/dayuse_intro.webp";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import restaurantPhoto from "@/public/images/webphotos_fins/webphoto_17.webp";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

function ProductList({ title }: { title?: string }) {
  useGSAP(() => {
    gsap.from("#private-course", {
      scrollTrigger: {
        trigger: "#private-course",
        toggleActions: "restart none none none",
        // start: "20px 80%",
        end: "top 75%",
        scrub: 1,
      },
      x: -200,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
    });
    gsap.from("#restaurant-photo", {
      scrollTrigger: {
        trigger: "#restaurant-photo",
        toggleActions: "restart none none none",
        end: "top 75%",
        scrub: 1,
      },
      x: -200,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
    });
    gsap.from("#restaurant-text", {
      scrollTrigger: {
        trigger: "#restaurant-text",
        toggleActions: "restart none none none",
        end: "top 75%",
        scrub: 1,
      },
      x: 600,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
    });
    gsap.from("#private-course-text", {
      scrollTrigger: {
        trigger: "#private-course-text",
        toggleActions: "restart none none none",
        end: "top 75%",
        scrub: 1,
      },
      x: 600,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
    });
    gsap.from("#dayuse-photo", {
      scrollTrigger: {
        trigger: "#dayuse-photo",
        toggleActions: "restart none none none",
        // start: "20px 80%",
        end: "top 75%",
        scrub: 1,
      },
      x: -200,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
    });
    gsap.from("#dayuse-text", {
      scrollTrigger: {
        trigger: "#dayuse-text",
        toggleActions: "restart none none none",
        // start: "20px 80%",

        end: "top 75%",
        scrub: 1,
      },
      x: 600,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
    });
  }, []);

  return (
    <section className=" flex flex-wrap justify-center">
      {/* Kiteusurfing Courses */}
      <div className="flex flex-col md:flex-row overflow-x-clip">
        <div id="private-course" className="md:w-[50vw] shrink-0">
          <Image
            src={privateCourse}
            alt="Private Course"
            className="relative z-20 aspect-video w-full object-cover"
            sizes="50vw"
            priority
          />
        </div>
        <div
          id="private-course-text"
          className="font-[family-name:var(--font-raleway)]"
        >
          <div className="w-full text-center text-2xl pt-8 mb-4">
            Kitesurfing courses
          </div>
          <div className="max-w-fit mx-8 text center text-xl mb-4">
            Learn kitesurfing at Fins kitesurfing school near Cairo. The
            shallow, waist-deep lagoon provides a safe environment for
            beginners, while consistent winds create ideal conditions.
            Experienced IKO instructors guide you through every step. Between
            sessions, unwind in luxury seating and enjoy delicious food—making
            your kitesurfing experience both exciting and memorable.
          </div>
        </div>
      </div>
      {/* Day use Experience */}
      <div className="flex flex-col-reverse md:flex md:flex-row  overflow-x-clip">
        <div
          id="dayuse-text"
          className="font-[family-name:var(--font-raleway)]"
        >
          <div className="w-full text-center text-2xl pt-8  mb-4">
            Day use at Fins beach club
          </div>
          <div className="max-w-fit mx-8 text center text-xl mb-4 ">
            Fins Beach Club sits on a protected lagoon where the water stays
            shallow and calm—perfect perfect to go relax in the sea or just want
            the kids to splash around safely. After you're done, grab a lounger
            by the pool with your drink and watch the kites and friends enjoying
            their time on the beach.
          </div>
          <div className="max-w-fit mx-8 text center text-xl mb-4">
            Find our location here:
          </div>
        </div>
        <div id="dayuse-photo" className="shrink-0 md:w-[50vw]">
          <Image
            src={dayuseintro}
            alt="Private Course"
            className="relative z-20 aspect-video w-full object-cover"
            priority
          />
        </div>
      </div>
      {/* Restaurant experience */}
      <div className="flex flex-col md:flex-row overflow-x-clip">
        <div id="restaurant-photo" className="md:w-[50vw] shrink-0">
          <Image
            src={restaurantPhoto}
            alt="Burger by the beach in sokhna"
            className="relative z-20 aspect-video w-full object-cover"
            sizes="50vw"
            priority
          />
        </div>
        <div
          id="restaurant-text"
          className="font-[family-name:var(--font-raleway)]"
        >
          <div className="w-full text-center text-2xl pt-8 mb-4">
            Restaurant by the beach experience
          </div>
          <div className="max-w-fit mx-8 text center text-xl mb-4">
            Enjoy delicious food with the Red Sea right in front of you. Our
            beach restaurant is the perfect spot to relax and eat well. We serve
            amazing Italian pizza made fresh in our stone oven, pasta that
            tastes just like it should, and juicy burgers that hit the spot
            every time. Everything is made with quality ingredients and plenty
            of flavor. Whether you're hungry after a swim or looking for a
            casual dinner with a view, come try our food. Great meals taste even
            better by the beach.
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductList;
