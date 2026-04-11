import neonSign from "@assets/generated_images/neon_sign_green_vibes_only.png";
import stickyNotes from "@assets/generated_images/wall_of_sticky_notes.png";
import guitar from "@assets/generated_images/acoustic_guitar_in_corner.png";
import { motion } from "framer-motion";
import { Music, Camera, PenTool } from "lucide-react";

export function Vibe() {
  return (
    <section id="vibe" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-sage-900 mb-4">Connect, Create, Capture.</h2>
          <p className="text-muted-foreground text-lg">
            A space designed for more than just coffee. It's where the community speaks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
          
          {/* Emotional Wall - Large Item */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-8 relative group rounded-3xl overflow-hidden border border-border shadow-md"
          >
            <img src={stickyNotes} alt="Emotional sticky note wall" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
              <div className="flex items-center gap-3 text-secondary mb-2">
                <PenTool className="w-5 h-5" />
                <span className="font-bold tracking-wider uppercase text-xs">The Emotional Wall</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">"Today I feel..."</h3>
              <p className="text-white/80 max-w-lg">
                Leave a note for a stranger, or write a wish for your future self. 
                Our sticky-note wall is where our community speaks.
              </p>
            </div>
          </motion.div>

          {/* Right Column - Stacked */}
          <div className="md:col-span-4 flex flex-col gap-6">
            
            {/* Neon Corner */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex-1 relative group rounded-3xl overflow-hidden border border-border shadow-md"
            >
              <img src={neonSign} alt="Neon sign" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-end">
                 <div className="flex items-center gap-2 text-primary-foreground mb-1">
                  <Camera className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase">Instagram Corner</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-white">Green Vibes Only</h3>
              </div>
            </motion.div>

            {/* Events / Guitar */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.3 }}
               className="flex-1 relative group rounded-3xl overflow-hidden border border-border shadow-md"
            >
              <img src={guitar} alt="Acoustic guitar" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <Music className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase">Events</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-white">Open Mic Nights 🎤</h3>
                <p className="text-white/80 text-sm mt-1">Poetry Sessions ✍️ & Study Hours 📖</p>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}
