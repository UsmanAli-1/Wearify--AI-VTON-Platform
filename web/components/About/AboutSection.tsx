"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Users, Sparkles, GraduationCap, UserCheck } from "lucide-react";
import Motion from "@/components/Motion";
import { fadeIn } from "@/lib/motion";
import { popUpslow } from "@/lib/motion";
import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section className="w-full px-6 md:px-20 pt-3 pb-3">
      <div className="max-w-6xl mx-auto text-center mb-5 pt-0">
        <Motion variant={fadeIn}>
          <p className="text-gray-100/50 max-w-4xl 2xl:max-w-5xl mx-auto leading-relaxed">
            We’re building an AI-powered fashion assistant that helps you
            discover what truly suits you. Upload your picture, and our system
            analyzes your body type and skin tone to recommend perfect outfits.
            <br />
            <br />
            You can also try on any garment you like — our Virtual Try-On
            technology shows a realistic preview of how it will look on you.
            <br />
            <br />
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="block "
            >
              <span className="font-bold text-white/80">
                Our goal is simple:
              </span>
              <br />
              <span className="font-semibold text-white/80">
                <i>
                  "Make online shopping personal, smart, and
                  confidence-boosting."
                </i>
              </span>
            </motion.span>
          </p>
        </Motion>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Project Title Card */}
        <Motion variant={popUpslow}>
          {/* <Card className="shadow-lg gap-3 min-h-[275px] bg-white/5 backdrop-blur-md border border-white/10 hover:scale-105 duration-300 "> */}
          <Card
            className="shadow-lg gap-3 min-h-[275px] 2xl:min-h-[320px]  
            bg-white/5 backdrop-blur-md border border-white/10 hover:scale-105 duration-300 flex flex-col"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-white shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <CardTitle className=" text-xl font-bold text-gray-200">
                Project Title
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-100/30 text-sm">
              Wearify - AI-Powered Virtual Try-On System
            </CardContent>
            <div className="inline-flex text-xs mx-5 mt-auto items-center gap-3 px-4 py-3 rounded-full shadow-lg bg-white/5 backdrop-blur-md border border-white/10">
              <GraduationCap className="w-5 h-5 text-[#F5F5DC]" />
              <span className=" text-[#F5F5DC]">
                Final Year Project — B.S. Computer Science, Iqra University
              </span>
            </div>
          </Card>
        </Motion>

        {/* Group Members Card */}
        <Motion variant={popUpslow}>
          <Card className="shadow-lg gap-3 min-h-[275px] 2xl:min-h-[320px]  bg-white/5 backdrop-blur-md border border-white/10 hover:scale-105 duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-white shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-200 ">
                Our Team
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-100/30 text-sm space-y-3">
              <p>
                <span className="font-semibold text-white/80">Member 1 :</span>{" "}
                Usman Ali – [23237] - "LEADER"
              </p>
              <p>
                <span className="font-semibold text-white/80">Member 2 :</span>{" "}
                Adil Usman – [23151]
              </p>
              <p>
                <span className="font-semibold text-white/80">Member 3 :</span>{" "}
                Syed Rohan Shah – [23166]
              </p>
              <p>
                <span className="font-semibold text-white/80">Member 4 :</span>{" "}
                Hadia Rafiq– [25195]
              </p>
            </CardContent>
          </Card>
        </Motion>

        {/* Supervisor Card */}
        <Motion variant={popUpslow}>
          <Card className="shadow-lg gap-3 bg-white/5 backdrop-blur-md border border-white/10 min-h-[275px] 2xl:min-h-[320px]    hover:scale-105 duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-400/50 to-blue-600/90 text-white shadow-md">
                <UserCheck className="w-6 h-6" />
              </div>
              <CardTitle className=" text-xl font-bold text-gray-200">
                Supervisor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-100/30 text-sm">
              <p className="font-semibold text-white/80 pb-1">Dr. Saad Ahmed</p>
              <p>Head of Department – Computer Science</p>
              <p>Iqra University</p>
            </CardContent>
          </Card>
        </Motion>
      </div>
    </section>
  );
}
