/**
 * Featured carousel: 5 swimming images with auto-play, navigation dots, and smooth transitions.
 * Featured style introduction to the home feed.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const featuredSlides = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    title: 'Olympic Dreams',
    subtitle: 'The road to Paris 2024',
    overlay: 'from-slate-900/80 via-slate-900/40 to-transparent',
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    title: 'World Records',
    subtitle: 'Breaking barriers in the pool',
    overlay: 'from-slate-900/85 via-slate-900/50 to-transparent',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    title: 'Championship Moments',
    subtitle: 'Elite competition at its finest',
    overlay: 'from-slate-900/80 via-slate-900/40 to-transparent',
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    title: 'Training Excellence',
    subtitle: 'Where champions are made',
    overlay: 'from-slate-900/85 via-slate-900/50 to-transparent',
  },
  {
    id: 5,
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    title: 'Swimming Culture',
    subtitle: 'Stories from the water',
    overlay: 'from-slate-900/80 via-slate-900/40 to-transparent',
  },
];

export function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredSlides.length);
  };

  return (
    <div
      className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={featuredSlides[currentIndex].imageUrl}
            alt={featuredSlides[currentIndex].title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${featuredSlides[currentIndex].overlay}`} />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {featuredSlides[currentIndex].title}
              </h2>
              <p className="text-lg md:text-xl text-slate-300 font-light">
                {featuredSlides[currentIndex].subtitle}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-900/80 transition-all opacity-0 group-hover:opacity-100 z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-900/80 transition-all opacity-0 group-hover:opacity-100 z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {featuredSlides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-cyan-400'
                : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
