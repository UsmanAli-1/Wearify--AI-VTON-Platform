import roseLatte from "@assets/generated_images/close_up_of_rose_latte.png";
import cardamomCoffee from "@assets/generated_images/cardamom_honey_coffee.png";
import butterflyTea from "@assets/generated_images/butterfly_pea_tea.png";
import dateShake from "@assets/generated_images/date_shake.png";
import pastries from "@assets/generated_images/fresh_pastries.png";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function Menu() {
  const drinks = [
    {
      name: "Rose Latte",
      desc: "A floral embrace in a cup.",
      image: roseLatte,
      price: "1400PKR",
      tag: "Signature"
    },
    {
      name: "Cardamom Honey Coffee",
      desc: "Warm, spicy, and sweet.",
      image: cardamomCoffee,
      price: "1100 PKR",
      tag: "Popular"
    },
    {
      name: "Butterfly Pea Tea",
      desc: "Colors shift from blue to purple.",
      image: butterflyTea,
      price: "1100 PKR",
      tag: "Iced"
    },
    {
      name: "Date Shake",
      desc: "Nature’s energy booster.",
      image: dateShake,
      price: "1600 PKR",
      tag: "Healthy"
    }
  ];

  return (
    <section id="menu" className="py-24 bg-sage-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-sage-900">Curated for the Soul</h2>
          <p className="text-muted-foreground text-lg">
            A limited menu means everything is premium, fresh, and made with purpose.
          </p>
        </div>

        {/* Signature Sips */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-2xl font-heading font-semibold text-primary">Signature Sips</h3>
            <div className="h-[1px] flex-1 bg-primary/20" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {drinks.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur text-secondary-foreground font-medium shadow-sm">
                      {item.tag}
                    </Badge>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-heading font-bold text-lg">{item.name}</h4>
                    <span className="font-bold text-primary">{item.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* From the Oven */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-3xl p-8 lg:p-12 border border-border shadow-sm">
          <div className="order-2 lg:order-1 space-y-6">
            <h3 className="text-3xl font-heading font-bold text-secondary">From the Oven</h3>
            <p className="text-lg text-muted-foreground">
              Freshly baked pastries & healthy organic snacks. Made daily with 
              premium ingredients, perfect for pairing with your favorite brew.
            </p>
            <ul className="space-y-3">
              {["Organic Oat Cookies", "Gluten-Free Brownies", "Sourdough Toast with Avocado"].map((snack, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground/80 font-medium">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  {snack}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2 relative aspect-video lg:aspect-square rounded-2xl overflow-hidden">
             <img 
                src={pastries} 
                alt="Fresh pastries" 
                className="w-full h-full object-cover"
              />
          </div>
        </div>

      </div>
    </section>
  );
}
