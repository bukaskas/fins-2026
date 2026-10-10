"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KitesurfingHero } from "./KitesurfingHero";
import { DayUseHero } from "./DayUseHero";
import { RestaurantHero } from "./RestaurantHero";

const heroComponents = [
  DayUseHero,
  KitesurfingHero,
  RestaurantHero,
];

const SLIDE_DURATION = 20000;

function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const touchStartX = useRef<number | null>(null);

  const navigate = useCallback((getNext: (prev: number) => number) => {
    if (transitionTimeoutRef.current)
      clearTimeout(transitionTimeoutRef.current);
    setIsTransitioning(true);
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentSlide(getNext);
      setIsTransitioning(false);
    }, 400);
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => navigate((p) => (p + 1) % heroComponents.length),
      SLIDE_DURATION,
    );
    return () => clearInterval(interval);
  }, [currentSlide, navigate]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const goToNext = () => navigate((p) => (p + 1) % heroComponents.length);
  const goToPrevious = () =>
    navigate((p) => (p - 1 + heroComponents.length) % heroComponents.length);
  const goToSlide = (index: number) => {
    if (index !== currentSlide) navigate(() => index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) delta > 0 ? goToNext() : goToPrevious();
    touchStartX.current = null;
  };

  const CurrentHeroComponent = heroComponents[currentSlide];
  const slideNum = String(currentSlide + 1).padStart(2, "0");
  const totalNum = String(heroComponents.length).padStart(2, "0");

  return (
    <>
      <style>{`
        @keyframes heroProgressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      <div
        className="relative h-screen -mt-29 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide content */}
        <div
          className={`h-full transition-opacity duration-500 ease-in-out motion-reduce:transition-none ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <CurrentHeroComponent />
        </div>

        {/* Slide counter — top right */}
        <div
          aria-hidden="true"
          className="absolute top-8 right-6 z-50 hidden sm:flex items-baseline gap-1.5 font-[family-name:var(--font-raleway)] select-none pointer-events-none"
        >
          <span className="text-white text-xl font-normal tabular-nums">
            {slideNum}
          </span>
          <span className="text-white/60 text-xs font-normal">/</span>
          <span className="text-white/70 text-xs font-normal tabular-nums">
            {totalNum}
          </span>
        </div>

        {/* Prev arrow */}
        <button
          onClick={goToPrevious}
          className="absolute left-3 sm:left-5 top-1/2 z-50 -translate-y-1/2 inline-flex size-11 items-center justify-center rounded-full text-white/80 hover:text-white transition-colors duration-200 cursor-pointer focus-visible:outline-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </button>

        {/* Next arrow */}
        <button
          onClick={goToNext}
          className="absolute right-3 sm:right-5 top-1/2 z-50 -translate-y-1/2 inline-flex size-11 items-center justify-center rounded-full text-white/80 hover:text-white transition-colors duration-200 cursor-pointer focus-visible:outline-white"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
        </button>

        {/* Progress bar indicators — bottom centre */}
        <div className="absolute bottom-5 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2">
          {heroComponents.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="group flex h-11 w-10 items-center cursor-pointer focus-visible:outline-white"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? "true" : undefined}
            >
              <span className="relative block h-[2px] w-full bg-white/30 overflow-hidden">
                {/* Completed slides */}
                {index < currentSlide && (
                  <span className="absolute inset-0 bg-white/70" />
                )}
                {/* Active slide — animated fill */}
                {index === currentSlide && (
                  <span
                    key={`active-${currentSlide}`}
                    className="absolute inset-y-0 left-0 bg-white"
                    style={{
                      animation: `heroProgressFill ${SLIDE_DURATION}ms linear forwards`,
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default HeroSection;
