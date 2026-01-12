"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KitesurfingHero } from "./KitesurfingHero";
import { DayUseHero } from "./DayUseHero";
import { RestaurantHero } from "./RestaurantHero";

const heroComponents = [KitesurfingHero, DayUseHero, RestaurantHero];

function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroComponents.length);
        setIsTransitioning(false);
      }, 300);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % heroComponents.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(
        (prev) => (prev - 1 + heroComponents.length) % heroComponents.length
      );
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (index !== currentSlide) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const CurrentHeroComponent = heroComponents[currentSlide];

  return (
    <div className="relative h-screen">
      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-gray-900" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-gray-900" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 gap-2">
        {heroComponents.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              currentSlide === index
                ? "w-8 bg-white"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Hero Component with Transition */}
      <div
        className={`transition-opacity duration-500 ease-in-out f-full ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <CurrentHeroComponent />
      </div>
    </div>
  );
}

export default HeroSection;
