"use client";

import Image from "next/image";

import privateCourse from "@/public/images/fins-private-lesson.webp";
import dayuseintro from "@/public/images/hero_images/dayuse_intro.webp";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import restaurantPhoto from "@/public/images/webphotos_fins/webphoto_17.webp";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            Kitesurfing courses near Cairo
          </div>
          <div className="max-w-fit mx-8 text center text-xl mb-4 flex flex-col gap-2">
            <div>
              Learn kitesurfing at Fins Kitesurfing School, just a short drive
              from Cairo. The shallow, waist‑deep lagoon is safe for beginners
              and fun for all levels. You will find:
            </div>
            <ul className="gap-2">
              <li>Sandy lagoon, with waist deep water</li>
              <li>IKO‑certified instructors to guide you</li>
              <li>Relaxing seating and good food between lessons</li>
            </ul>
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
            <div>
              Enjoy a calm, protected lagoon where the water stays shallow and
              smooth. It is perfect for a quiet swim or safe playtime for kids.
            </div>
            <div>
              After your swim, stretch out on a poolside lounger with a drink in
              hand. Watch the kites in the sky and friends having fun on the
              beach.
            </div>
          </div>
          <div className="max-w-fit mx-8  text-xl mb-4 flex gap-4 items-center ">
            Find our location here:
            <span>
              <Button variant="secondary" className="rounded-full ">
                <Link href="https://maps.app.goo.gl/jwJTUPVJjCc62Vh36">
                  Google Maps
                </Link>
              </Button>
            </span>
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
            Beach restaurant near Sokhna
          </div>
          <div className="max-w-fit mx-8 text center text-xl mb-4 flex flex-col gap-2">
            <div>
              Sit by the sea and enjoy fresh, tasty food with a clear Red Sea
              view. Our menu features:
            </div>
            <ul>
              <li>Oven baked Italian Pizza</li>
              <li>Classic pasta dishes</li>
              <li>Juicy burgers</li>
            </ul>
            <div>
              Whether you come after a session in the water or for a relaxed
              meal, Fins Beach Club makes it easy to enjoy your time by the
              beach.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductList;
