import { Leaf, Instagram, Facebook, Twitter, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-sage-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-sage-50" />
              <span className="font-heading text-xl font-bold">Oven By Nature</span>
            </div>
            <p className="text-sage-100/80 text-sm leading-relaxed max-w-xs">
              A sanctuary designed for peace, creativity, and connection. 
              Freshly brewed with love and a commitment to our planet.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-6">Explore</h4>
            <ul className="space-y-3">
              {["Our Menu", "The Vibe", "Sustainability", "The Team", "Contact Us"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sage-100/70 hover:text-white transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-6">Visit Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sage-100/70 text-sm">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                <span>Iqra University,<br />Gulshan Campus ,<br />Karachi, 75300</span>
              </li>
              <li className="flex items-center gap-3 text-sage-100/70 text-sm">
                <Mail className="w-5 h-5 shrink-0" />
                <span>sales@ovenbynature.com</span>
              </li>
              <li className="flex items-center gap-3 text-sage-100/70 text-sm">
                <Phone className="w-5 h-5 shrink-0" />
                <span>+92 317841 4882</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-6">Follow Us</h4>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="font-heading italic text-lg text-sage-100">"Sip. Relax. Repeat."</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-sage-100/50">
          <p>© 2024 Oven By Nature. All Rights Reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
