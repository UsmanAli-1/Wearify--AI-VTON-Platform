"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center 
    
  bg-white/5 backdrop-blur-md border border-white/10 "
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/logo3.png"
          alt="Wearify"
          width={120}
          height={120}
          priority
        />
      </motion.div>
    </div>
  );
}
