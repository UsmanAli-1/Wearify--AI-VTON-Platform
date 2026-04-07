"use client";

import Image from "next/image";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BASE_URL from "@/config/api";

export default function SignIn() {
  const router = useRouter();

  const [formloginData, setFormloginData] = useState({
    email: "",
    password: "",
  });

  const handleChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormloginData({
      ...formloginData,
      [e.target.name]: e.target.value,
    });
  };

  // const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   const response = await fetch(`${BASE_URL}/api/users/login`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     credentials: "include",
  //     body: JSON.stringify(formloginData),
  //   });

  //   const data = await response.json();

  //   if (response.ok) {
  //     window.dispatchEvent(new Event("auth-changed"));
  //     router.push("/");
  //   } else {
  //     console.log(data.message);
  //   }
  // };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const response = await fetch(`${BASE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ✅ Remove credentials: "include" — no longer needed
    body: JSON.stringify(formloginData),
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem("token", data.token); // ✅ store token
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  } else {
    console.log(data.message);
  }
};
  return (
    <>
      <section className="min-h-[calc(100vh-100px)] flex items-center justify-center ">
        <div className="h-full w-full flex items-center justify-center ">
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
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath:
                      "path('M 60 40 C 140 -20, 320 10, 360 140 C 400 260, 300 380, 180 400 C 60 420, -40 300, 20 160 C 40 100, 20 80, 60 40 Z')",
                  }}
                >
                  <Image
                    src="/images/hero6.jpeg"
                    alt="AI Try On"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - LOGIN CARD */}
            <Card
              className="w-full md:w-1/2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 md:py-6 py-5
                     shadow-2xl hover:scale-105 duration-300 transition"
            >
              <CardContent className="">
                {/* Gradient Login Text */}
                <h2 className="md:text-4xl text-3xl font-bold text-center bg-gradient-to-r from-purple-400/50 to-blue-600/90 bg-clip-text text-transparent  pb-8">
                  Sign In
                </h2>

                <form onSubmit={handleLogin}>
                  {/* Email */}
                  <Input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="mb-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-gray-300 focus:border-purple-400 shadow-md"
                    onChange={handleChanges}
                    value={formloginData.email}
                    required
                  />

                  {/* Password */}
                  <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="mb-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-gray-300 focus:border-purple-400 shadow-md"
                    onChange={handleChanges}
                    value={formloginData.password}
                    required
                  />

                  {/* Forgot Password */}
                  {/* <p className="text-center text-sm text-gray-700 mb-4 hover:underline cursor-pointer">
                                        Forget Password?
                                    </p> */}

                  {/* Login Button */}
                  <Button
                    className="w-full py-2 shadow-md mb-2 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-400/50 to-blue-600/90"
                    type="submit"
                  >
                    Sign In
                  </Button>
                </form>

                {/* OR */}
                <div className="flex items-center my-2">
                  <div className="flex-1 h-[1px] bg-gray-400" />
                  <span className="px-4 text-gray-400">OR</span>
                  <div className="flex-1 h-[1px] bg-gray-400" />
                </div>

                {/* Register Link */}
                <p className="text-center text-sm mt-6 text-gray-300">
                  Don’t have an account?
                  <a
                    href="/signup"
                    className="text-blue-600 ml-1 font-medium hover:underline"
                  >
                    Sign Up
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
