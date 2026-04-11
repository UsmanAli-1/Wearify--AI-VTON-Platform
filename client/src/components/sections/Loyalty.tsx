import { Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Loyalty() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="bg-sage-900 rounded-3xl p-8 md:p-16 text-white overflow-hidden relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">Little Things, Big Love.</h2>
              <p className="text-sage-100/80 text-lg max-w-md">
                Join our loyalty program. Collect 5 stamps, and the 6th coffee is on us. 
                Because we appreciate you.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                 <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-bold rounded-full">
                   Join Loyalty Program
                 </Button>
                 <div className="flex items-center gap-2 text-sm text-sage-100/70 px-2">
                   <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                   Get a Free Biscuit with your first order!
                 </div>
              </div>
            </div>

            {/* Stamp Card Visual */}
            <div className="relative">
              <div className="bg-[#f3f0e6] text-sage-900 p-8 rounded-2xl shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-500 max-w-md mx-auto">
                <div className="flex justify-between items-center mb-8">
                  <span className="font-heading font-bold text-xl">Loyalty Card</span>
                  <span className="text-xs uppercase tracking-wider font-bold text-sage-500">Oven By Nature</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="aspect-square rounded-full border-2 border-dashed border-sage-300 flex items-center justify-center text-sage-400">
                      <Stamp className="w-6 h-6 opacity-20" />
                    </div>
                  ))}
                  <div className="aspect-square rounded-full bg-secondary text-white flex items-center justify-center font-bold shadow-lg">
                    Free
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
