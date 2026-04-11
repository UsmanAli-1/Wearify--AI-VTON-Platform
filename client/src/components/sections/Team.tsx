import member1 from "@assets/generated_images/portrait_of_team_member_male.png";
import member2 from "@assets/generated_images/portrait_of_team_member_female.png";
import member3 from "@assets/generated_images/portrait_of_team_member_male_glasses.png";
import member4 from "@assets/generated_images/portrait_of_team_member_male_casual.png";

export function Team() {
  const team = [
    {
      name: "Syed Rohan Shah",
      id: "IU02-0122-0358",
      role: "Visionary & Founder",
      image: member1
    },
    {
      name: "Zainab Rubab",
      id: "IU02-0225-1112",
      role: "Creative Director",
      image: member2
    },
    {
      name: "Abeer Ahmed",
      id: "20157",
      role: "Head of Operations",
      image: member3
    },
    {
      name: "Mohid",
      id: "IU02-0124-0151",
      role: "Community Manager",
      image: member4
    },
    {
      name: "Madiha",
      id: "28715",
      role: "Community Manager",
      image: member2 // Reusing member2 image for now
    }
  ];

  return (
    <section id="team" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-sage-900 mb-4">The Minds Behind the Brew</h2>
          <p className="text-muted-foreground">Meet the team dedicated to your daily dose of nature.</p>
        </div>

        {/* Layout Tip: I changed 'grid' to 'flex-wrap' here. 
           With 5 people, a strict 4-column grid leaves the 5th person lonely on the left.
           Flexbox centers the last person automatically, which looks much better.
        */}
        <div className="flex flex-wrap justify-center gap-8">
          {team.map((member, i) => (
            <div key={i} className="group text-center w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-2rem)] max-w-[250px]">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-sage-100 shadow-md group-hover:border-secondary transition-colors duration-300">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground">{member.name}</h3>
              <p className="text-xs text-muted-foreground mb-1">{member.id}</p>
              <p className="text-primary font-medium text-sm">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}