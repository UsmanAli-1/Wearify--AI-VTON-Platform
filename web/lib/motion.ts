// // lib/motion.ts

// // Fade + slide up (for headings, text)
// export const fadeUp = {
//   hidden: {
//     opacity: 0,
//     y: 40,
//   },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.5,
//       ease: "easeOut",
//     },
//   },
//   exit: {
//     opacity: 0,
//     y: 40,
//   },
// };

// export const fadeIn = {
//   hidden: {
//     opacity: 0,
//     y: 60,
//   },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.7,
//       ease: "easeOut",
//     },
//   },
//   exit: {
//     opacity: 0,
//     y: 40,
//   },
// };

// // Scale + fade (for cards, images, boxes)
// export const popUp = {
//   hidden: {
//     scale: 0.7,
//     opacity: 0,
//   },
//   show: {
//     scale: 1,
//     opacity: 1,
//     transition: {
//       duration: 0.5,
//       ease: "easeOut",
//     },
//   },
// };

// export const popUpslow = {
//   hidden: {
//     scale: 0.5,
//     opacity: 0,
//   },
//   show: {
//     scale: 1,
//     opacity: 1,
//     transition: {
//       duration: 0.9,
//       ease: "easeOut",
//     },
//   },

// };






// lib/motion.ts

const smoothEase = [0.25, 0.8, 0.25, 1]; // smoother, less snap

// Fade + slide up (text, headings)
export const fadeUp = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,     // ⬅️ slower
      delay: 0.05,       // ⬅️ subtle smoothness
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: 60,
  },
};

// Hero / section titles
export const fadeIn = {
  hidden: {
    opacity: 0,
    y: 80,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.1,     // ⬅️ hero feels premium
      delay: 0.1,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: 60,
  },
};

// Cards, buttons
export const popUp = {
  hidden: {
    scale: 0.85,
    opacity: 0,
  },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.75,    // ⬅️ slower than before
      delay: 0.05,
      ease: smoothEase,
    },
  },
};

// Large blocks / galleries
export const popUpslow = {
  hidden: {
    scale: 0.75,
    opacity: 0,
  },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1.2,     // ⬅️ noticeably smoother
      delay: 0.1,
      ease: smoothEase,
    },
  },
};

