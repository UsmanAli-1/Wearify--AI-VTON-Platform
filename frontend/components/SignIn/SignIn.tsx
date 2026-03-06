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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const response = await fetch(`${BASE_URL}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formloginData),
    });

    const data = await response.json();

    if (response.ok) {
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
            <div className="-top-20 flex flex-col items-center justify-center text-center w-full h-full md:w-1/2">
              {/* Bigger Side Logo */}
              <Image
                src="/images/logo3.png"
                alt="Side Logo"
                width={340}
                height={340}
                className="hidden md:block md:w-64 lg:w-80 object-contain md:mb-4 mx-auto"
              />
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
