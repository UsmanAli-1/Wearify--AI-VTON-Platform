"use client";

import Image from "next/image";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { useState } from "react";
import toast from "react-hot-toast";
import BASE_URL from "@/config/api";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const router = useRouter();

  const handleChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Send data to backend
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
      });
      toast.success("user created");
      router.push("/signin");
    } else {
      const data = await response.json();
      toast.error(data.message || "Something went wrong");
    }
  };
  return (
    <>
      <section className="min-h-[calc(100vh-110px)] flex items-center justify-center ">
        <div className="h-full  w-full flex items-center justify-center">
          <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-between px-6 md:px-12 md:gap-45">
            {/* LEFT SIDE */}
            <div className="hidden md:flex md:w-1/2 items-center justify-center hover:scale-105 duration-300 transition">
              <div className="relative w-[380px] h-[420px]">
                {/* Glow behind */}
                <div className="absolute inset-0 blur-3xl opacity-60 bg-gradient-to-r from-purple-500 to-blue-500"></div>

                {/* Gradient Background Blob */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-80 blur-[2px]"
                  style={{
                    clipPath:
                      "path('M 60 40 C 140 -20, 320 10, 360 140 C 400 260, 300 380, 180 400 C 60 420, -40 300, 20 160 C 40 100, 20 80, 60 40 Z')",
                  }}
                />

                {/* Image with same blob shape */}
                <div
                  className="absolute inset-0 overflow-hidden "
                  style={{
                    clipPath:
                      "path('M 60 40 C 140 -20, 320 10, 360 140 C 400 260, 300 380, 180 400 C 60 420, -40 300, 20 160 C 40 100, 20 80, 60 40 Z')",
                  }}
                >
                  <Image
                    src="/images/hero8.jpeg"
                    alt="AI Try On"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - SIGNUP CARD */}
            <Card
              className="w-full md:w-1/2 md:rounded-xl bg-white/5 backdrop-blur-md border border-white/10 md:py-6  py-5
                     shadow-2xl hover:scale-105 duration-300 transition"
            >
              <CardContent>
                <form onSubmit={handleSubmit}>
                  {/* Title */}
                  <h2 className="md:text-4xl text-3xl font-bold text-center bg-gradient-to-r from-purple-400/50 to-blue-600/90 bg-clip-text text-transparent pb-6 ">
                    Sign Up
                  </h2>

                  {/* Full Name */}
                  <label className="text-sm font-medium bg-gradient-to-r from-purple-400/50 to-blue-600/90 bg-clip-text text-transparent">
                    Full Name
                  </label>
                  <Input
                    placeholder="Enter your name"
                    type="text"
                    name="name"
                    className="mb-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-gray-300 focus:border-purple-400 shadow-md"
                    onChange={handleChanges}
                    value={formData.name}
                    required
                  />

                  {/* Email  */}
                  <label className="text-sm font-medium bg-gradient-to-r from-purple-400/50 to-blue-600/90 bg-clip-text text-transparent">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="mb-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-gray-300 focus:border-purple-400 shadow-md"
                    onChange={handleChanges}
                    value={formData.email}
                    required
                  />

                  {/* Phone */}
                  <label className="text-sm font-medium bg-gradient-to-r from-purple-400/50 to-blue-600/90 bg-clip-text text-transparent">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    className="mb-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-gray-300 focus:border-purple-400 shadow-md"
                    onChange={handleChanges}
                    value={formData.phone}
                    required
                  />

                  {/* Password */}
                  <label className="text-sm font-medium bg-gradient-to-r from-purple-400/50 to-blue-600/90 bg-clip-text text-transparent">
                    Password
                  </label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-gray-300 focus:border-purple-400 shadow-md"
                    onChange={handleChanges}
                    value={formData.password}
                    required
                  />

                  {/* Create Account Button */}
                  <Button
                    className="w-full mb-4 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-400/50 to-blue-600/90 shadow-md"
                    type="submit"
                  >
                    Create Account
                  </Button>

                  {/* Login Link */}
                  <p className="text-center text-sm text-gray-300">
                    Already have an account?
                    <a
                      href="/signin"
                      className="font-semibold text-blue-600 ml-1 hover:underline"
                    >
                      Sign In
                    </a>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
