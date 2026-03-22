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
  faWandSparkles,
  faCrown
} from "@fortawesome/free-solid-svg-icons";
import {
  faCircleQuestion,
  faImages,
} from "@fortawesome/free-regular-svg-icons";
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

  // linking and active section underline
  const links = [
    { href: "/", label: "Try On", icon: faShirt },
    { href: "/about", label: "About", icon: faCircleQuestion },
    { href: "/features", label: "Features", icon: faWandSparkles },
    { href: "/plans", label: "Plans", icon: faCrown  },
  ];

  const linkClass = (href: string) =>
    `px-2 py-1 rounded-md relative transition  ${
      pathname === href
        ? "bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-[white] "
        : "text-gray-500 "
    }`;

  const mobileLinkClass = (href: string) =>
    `px-4 py-2 rounded-xl transition  ${
      pathname === href
        ? "bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-[white] "
        : "text-gray-500"
    }`;

  return (
    <div className="fixed md:relative top-2 md:top-0 left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 w-[88%] md:w-full z-50 flex justify-center pointer-events-none">
      {/* Header Card */}
      <div
        className="pointer-events-auto w-full rounded-2xl bg-white/10 backdrop-blur-md 
      border border-white/10 shadow-lg md:bg-transparent md:backdrop-blur-none md:border-none md:shadow-none"
      >
        <nav className="flex items-center justify-between px-2 pr-4 md:px-8 ">
          {/* Logo */}
          <a href="/" className="flex items-center hover:scale-110  transition">
            <Image
              src="/images/logow.png"
              alt="Logo"
              width={70}
              height={0}
              className="object-cover py-4"
            />
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 text-gray-500 relative ">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`${linkClass(link.href)} flex items-center gap-2`}
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
                                hover:from-[#4287f5] hover:to-[#6a339e] text-white hover:scale-105 duration-300"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="hidden shadow-md md:block rounded-full bg-gradient-to-r from-purple-400/50 to-blue-600/90
                                hover:from-[#4287f5] hover:to-[#6a339e] text-white hover:scale-105 duration-300"
              >
                <a href="/signin">Sign In / Sign Up</a>
              </Button>
            )}
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="outline"
                onClick={toggleMenu}
                className="p-2 rounded-md bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-white/80 border-none"
              >
                <FontAwesomeIcon icon={isOpen ? faXmark : faBars} size="lg" />
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        className={`pointer-events-auto z-[100] md:hidden fixed top-[75px] left-1/2 -translate-x-1/2 w-[100%] bg-white/10 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-screen py-4" : "max-h-0"
        }`}
      >
        <div className="flex flex-col  px-6 font-medium">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={toggleMenu}
              className={`${mobileLinkClass(link.href)} flex items-center gap-2`}
            >
              <FontAwesomeIcon icon={link.icon} className="text-sm" />
              {link.label}
            </a>
          ))}

          {user ? (
            <Button
              onClick={handleSignOut}
              className="rounded-full shadow-lg bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-white mt-2"
            >
              Sign Out
            </Button>
          ) : (
            <Button className="rounded-full shadow-lg bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-white mt-2">
              <a href="/signin">Sign In / Sign Up</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
