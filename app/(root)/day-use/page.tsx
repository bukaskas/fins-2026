import Image from "next/image";
import heroDayUse from "@/public/images/day_use/beach2.webp";
import beachExperienceImage from "@/public/images/day_use/beach1.webp";
import foodExperienceImage from "@/public/images/day_use/food.webp";
import loungeExperienceImage from "@/public/images/day_use/lounge.webp";
import gamesExperienceImage from "@/public/images/day_use/games.webp";
function DayUsePage() {
  return (
    <section className="font-[family-name:var(--font-raleway)] ">
      <HeroSection />
      <div className="flex flex-col md:flex-row">
        <BeachExperienceImage />
        <FoodExperienceImage />
      </div>
      <div className="flex flex-col md:flex-row">
        <LoungeExperienceImage />
        <GamesExperienceImage />
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
          alt="Delicious food options at Fins Sokhna restaurant including burgers, pizza, and salads"
          className="relative z-5  w-full h-full object-cover object-[center_75%] aspect-3/2"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Restaurant
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Enjoy our burgers, pizza, and salads.
        </div>
      </div>
    </div>
  );
}

function LoungeExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="lounge-photo" className="md:w-[50vw] shrink-0 relative ">
        <Image
          src={loungeExperienceImage}
          alt="Lounge area at Fins Sokhna with comfortable seating and relaxing ambiance"
          className="relative z-5  w-full h-full object-cover object-[center_75%] aspect-3/2"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Lounge
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Amazing lounge area to relax and unwind.
        </div>
      </div>
    </div>
  );
}

function GamesExperienceImage() {
  return (
    <div className="flex flex-col md:flex-row ">
      <div id="games-photo" className="md:w-[50vw] shrink-0 relative ">
        <Image
          src={gamesExperienceImage}
          alt="Lounge area at Fins Sokhna with comfortable seating and relaxing ambiance"
          className="relative z-5  w-full h-full object-cover object-[center_75%] aspect-3/2"
          sizes="50vw"
          priority
        />
        <div className="absolute bottom-[15%] z-10 left-4 text-white font-semibold text-4xl">
          Games
        </div>
        <div className="absolute  bottom-[8%] z-10 left-4 text-white italic">
          Enjoy a variety of fun games to play by the beach.
        </div>
      </div>
    </div>
  );
}
