import Image from "next/image";
import heroDayUse from "@/public/images/day_use/beach2.webp";
import beachExperienceImage from "@/public/images/day_use/beach1.webp";
import foodExperienceImage from "@/public/images/day_use/food.webp";
function DayUsePage() {
  return (
    <section className="font-[family-name:var(--font-raleway)] ">
      <HeroSection />
      <BeachExperienceImage />
      <FoodExperienceImage />
      <div>
        <h1 className="text-xl font-semibold pb-4">Games</h1>
        <div>
          The best place to enjoy games is by the beach—and we’ve got you
          covered. We offer volleyball, beach football, a yoga space, and ping
          pong. Choose your game and join your friends for a day full of action
          and fun.
        </div>
      </div>
      <div>
        <h1 className="text-xl font-semibold pb-4">Atmosphere</h1>
        <div>
          We always look to set good atmosphere for people to enjoy the day.
        </div>
      </div>
    </section>
  );
}

export default DayUsePage;

function HeroSection() {
  return (
    <div>
      <Image
        src={heroDayUse}
        alt="Day Use experience at Fins Sokhna"
        className="absolute inset-0 -z-10 min-h-150 max-h-150 object-cover"
        priority
      />
      <h4 className="text-center text-stone-800 font-semibold mt-100 text-4xl  ">
        Day Use at Fins
      </h4>
    </div>
  );
}

function BeachExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="beach-photo" className="md:w-[50vw] shrink-0 relative">
        <Image
          src={beachExperienceImage}
          alt="Sandy beach at Fins Sokhna with umbrellas and sun loungers"
          className="relative z-5  w-full object-cover"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Beach Access
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Widest sandy beach in Sokhna area
        </div>
      </div>
    </div>
  );
}

function FoodExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="food-photo" className="md:w-[50vw] shrink-0 relative ">
        <Image
          src={foodExperienceImage}
          alt="Sandy beach at Fins Sokhna with umbrellas and sun loungers"
          className="relative z-5  w-full h-full object-cover object-[center_75%] aspect-3/2"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Restaurant
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          What a day without tasty and high quality food
        </div>
      </div>
    </div>
  );
}
