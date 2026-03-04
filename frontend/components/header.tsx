"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faGem,
  faShirt,
} from "@fortawesome/free-solid-svg-icons";
import { faCircleQuestion , faImages  } from "@fortawesome/free-regular-svg-icons";
import { useRouter } from "next/navigation";
import BASE_URL from "@/config/api";

export default function Header() {
  const router = useRouter();
  type User = {
    id: string;
    name: string;
    email: string;
    points: number;
  };

  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  // get user data

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/users/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const userData = await res.json();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };

    // run once on load
    fetchUser();

    // run after login/logout
    window.addEventListener("auth-changed", fetchUser);

    return () => {
      window.removeEventListener("auth-changed", fetchUser);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch(`${BASE_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include", // important
      });

      setUser(null);
      window.dispatchEvent(new Event("auth-changed")); // optional but recommended
      window.location.reload();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Only detect sections on homepage
  useEffect(() => {
    if (pathname !== "/") return; // Do nothing on signin/signup pages

    const sections = ["tryon", "about", "collection"];
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.5 },
      );
      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [pathname]);

  // linking and active section underline
  const links = [
    { id: "tryon", label: "Try On", icon: faShirt },
    { id: "about", label: "About", icon: faCircleQuestion },
    { id: "collection", label: "Collection", icon: faImages },
  ];

  const linkClass = (id: string) =>
    `px-2 py-1 rounded-md relative transition  ${
      pathname === "/" && activeSection === id
        ? "bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-[white] "
        : "text-gray-500 "
    }`;

  const mobileLinkClass = (id: string) =>
    `px-4 py-2 rounded-xl transition ${
      pathname === "/" && activeSection === id
        ? "bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-[white] "
        : "text-gray-500"
    }`;

  return (
    <header className="  left-0 right-0 z-50 flex justify-center pointer-events-none">
      {/* Header Card */}
      {/* <div className="pointer-events-auto w-[92%] md:w-[90%] max-w-7xl bg-[#1C1C1C]/30 backdrop-blur-md rounded-2xl shadow-lg"> */}
      <div className="pointer-events-auto w-[100%] ">
        <nav className="flex items-center justify-between px-6 md:px-8 ">
          {/* Logo */}
          <a href="/" className="flex items-center hover:scale-110  transition">
            <Image
              src="/images/logo5.png"
              alt="Logo"
              width={160}
              height={0}
              className="object-cover py-2"
            />
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 text-gray-500 relative ">
            {links.map((link) => (
              <a
                key={link.id}
                href={`/#${link.id}`}
                onClick={() => setActiveSection(link.id)}
                className={`${linkClass(link.id)} flex items-center gap-2`}
              >
                <FontAwesomeIcon icon={link.icon} className="text-sm" />
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Points */}
            {user?.points != null && (
              <div className="md:flex items-center  bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-[White] px-3 py-1 rounded-lg">
                <FontAwesomeIcon
                  icon={faGem}
                  className="text-[#1C1C1C] text-sm  pr-2"
                />
                <span className="text-sm font-medium">{user.points}</span>
              </div>
            )}

            {/* Auth Button */}
            {user ? (
              <Button
                onClick={handleSignOut}
                className="hidden md:block rounded-full bg-gradient-to-r from-purple-400/50 to-blue-600/90
                                hover:from-[#4287f5] hover:to-[#6a339e] text-black hover:scale-105 duration-300"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="hidden shadow-md md:block rounded-full bg-gradient-to-r from-purple-400/50 to-blue-600/90
                                hover:from-[#4287f5] hover:to-[#6a339e] text-black hover:scale-105 duration-300"
              >
                <a href="/signin">Sign In / Sign Up</a>
              </Button>
            )}
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="outline"
                onClick={toggleMenu}
                className="p-2 rounded-md bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-[#1C1C1C] border-none"
              >
                <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={`pointer-events-auto md:hidden fixed top-[95px] left-1/2 -translate-x-1/2 w-[92%] bg-[#1C1C1C]/30 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-screen py-4" : "max-h-0"
        }`}
      >
        <div className="flex flex-col  px-6 font-medium">
          {links.map((link) => (
            <a
              key={link.id}
              href={`/#${link.id}`}
              onClick={() => {
                setActiveSection(link.id);
                toggleMenu();
              }}
              className={`${mobileLinkClass(link.id)} flex items-center gap-2`}
            >
              <FontAwesomeIcon icon={link.icon} className="text-sm" />
              {link.label}
            </a>
          ))}

          {user ? (
            <Button
              onClick={handleSignOut}
              className="rounded-full shadow-lg bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-black mt-2"
            >
              Sign Out
            </Button>
          ) : (
            <Button className="rounded-full shadow-lg bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-black mt-2">
              <a href="/signin">Sign In / Sign Up</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
