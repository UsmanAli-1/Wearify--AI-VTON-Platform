import { Recycle, Sun, Heart } from "lucide-react";

export function Sustainability() {
  const goals = [
    {
      icon: Recycle,
      sdg: "SDG 12",
      title: "Responsible Consumption",
      desc: "We say no to plastic. Our cups are biodegradable, stirrers are wooden, and we encourage reusable glass jars.",
      color: "text-emerald-600",
      bg: "bg-emerald-100"
    },
    {
      icon: Sun,
      sdg: "SDG 13",
      title: "Climate Action",
      desc: "Reducing our carbon footprint through sustainable sourcing and energy-efficient practices. Every cup helps the planet.",
      color: "text-amber-600",
      bg: "bg-amber-100"
    },
    {
      icon: Heart,
      sdg: "SDG 3",
      title: "Good Health & Well-Being",
      desc: "We prioritize your health by serving organic beverages and nutritious snacks free from harmful preservatives.",
      color: "text-rose-600",
      bg: "bg-rose-100"
    }
  ];

  return (
    <section id="sustainability" className="py-24 bg-sage-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Our Commitment</span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-sage-900 mb-6">Brewing a Better Future 🌍</h2>
          <p className="text-muted-foreground text-lg">
            We believe in responsible luxury. Here is how we align with the United Nations Sustainable Development Goals:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {goals.map((goal, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-border shadow-sm hover:shadow-lg transition-shadow">
              <div className={`w-14 h-14 rounded-2xl ${goal.bg} flex items-center justify-center mb-6`}>
                <goal.icon className={`w-7 h-7 ${goal.color}`} />
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${goal.bg} ${goal.color} mb-3`}>
                {goal.sdg}
              </span>
              <h3 className="text-xl font-heading font-bold text-foreground mb-3">{goal.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {goal.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
