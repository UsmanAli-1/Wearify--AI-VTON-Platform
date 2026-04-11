import heroImage from "@assets/generated_images/sunlit_cafe_table_with_rose_latte_and_plants.png";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Sunlit cafe table"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary/80 backdrop-blur-md border border-white/20 text-sm font-medium tracking-wide mb-4">
            Freshly brewed with love 💚
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight drop-shadow-lg">
            Making Your Mornings Greener,<br />
            <span className="text-sage-100 font-serif italic">One Cup at a Time!</span> 🌿
          </h1>

          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
            Welcome to Oven By Nature. Where fresh coffee meets sustainable living.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 text-base shadow-xl transition-transform hover:scale-105"
            >
              Explore Our Menu
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white/40 text-primary-foreground hover:bg-white/10 hover:text-white rounded-full px-8 h-12 text-base backdrop-blur-sm bg-transparent"
            >
              Our Story
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent opacity-50" />
      </motion.div>
    </section>
  );
}
