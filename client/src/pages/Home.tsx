import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { Menu } from "@/components/sections/Menu";
import { Vibe } from "@/components/sections/Vibe";
import { Sustainability } from "@/components/sections/Sustainability";
import { Loyalty } from "@/components/sections/Loyalty";
import { Team } from "@/components/sections/Team";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <main>
        <Hero />
        <Intro />
        <Menu />
        <Vibe />
        <Sustainability />
        <Loyalty />
        <Team />
      </main>
      <Footer />
    </div>
  );
}
