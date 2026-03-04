"use client";

import { useState, useEffect } from "react";

export default function BackgroundDots() {
  const [dots, setDots] = useState<{ top: string; left: string; size: string; delay: string }[]>([]);

  useEffect(() => {
    const generatedDots = Array.from({ length: 70 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 2}px`,
      delay: `${Math.random() * 2}s`,
    }));
    setDots(generatedDots);
  }, []);

  if (dots.length === 0) return null; // render nothing during SSR

  return (
    <div className="absolute  w-full h-full z-0 pointer-events-none">
      {dots.map((dot, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full opacity-20 animate-pulse"
          style={{
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}
