// app/page.tsx
import VirtualTryOnSection from "@/components/VirtualTryOnSection";
import HeroSection from "@/components/HeroSection";
import AiPoweredFeatures from "@/components/AiPoweredFeatures";
import HowItWorksSection from "@/components/HowItWorksSection";
import VirtualTryOnGallery from "@/components/VirtualTryOnGallery";
import AboutSection from "@/components/AboutSection";

export default function Home() {
  return (
    <div>
      <section id="tryon">
        <VirtualTryOnSection />
      </section>
      {/* <section id="about">
        <AboutSection />
      </section>
      <section id="collection">
        <VirtualTryOnGallery />
      </section> */}
    </div>
  );
}
