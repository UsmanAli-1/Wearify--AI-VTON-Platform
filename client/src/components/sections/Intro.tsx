import introImage from "@assets/generated_images/eco-friendly_cafe_interior.png";
import { BookOpen, Leaf, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function Intro() {
  const features = [
    {
      icon: BookOpen,
      title: "Book Nook",
      desc: "Read while you sip.",
    },
    {
      icon: Leaf,
      title: "Garden Vibe",
      desc: "Surrounded by real greenery.",
    },
    {
      icon: Sparkles,
      title: "Good Vibes",
      desc: "A space to think and relax.",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1 space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-sage-900 leading-tight">
                More Than Coffee—<br />
                <span className="text-secondary italic">It’s an Experience.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We aren't just a café; we are a movement. Oven By Nature is a 
                sanctuary designed for those who seek peace, creativity, and connection. 
                Whether you are here to study, heal, or catch up with friends, our 
                space is built to bring you closer to nature.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              {features.map((feature, i) => (
                <div key={i} className="flex flex-col items-start gap-3 p-4 rounded-xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={introImage} 
                alt="Eco-friendly cafe interior" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay" />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-secondary rounded-full blur-2xl opacity-20" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
