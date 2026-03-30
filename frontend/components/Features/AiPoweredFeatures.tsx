"use client";

import { Card, CardContent } from "@/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCube,
    faWandMagicSparkles,
    faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import Motion from "@/components/Motion";
import { popUpslow } from "@/lib/motion";

export default function AiPoweredFeatures() {
    const features = [
        {
            icon: faCube,
            title: "2D Virtual Fitting",
            desc: "Upload your photos and see clothes on your body instantly. Our AI adapts to your body shape and posture for realistic results.",
        },
        {
            icon: faWandMagicSparkles,
            title: "Style Recommendations",
            desc: "Get personalized outfit suggestions based on your preferences, body type, and skin tone.",
        },
        {
            icon: faShareNodes,
            title: "Social Sharing",
            desc: "Share your virtual looks with your friends and get instant feedback before making a purchase decision.",
        },
    ];

    return (
        <section className="w-full px-6 md:px-20 pt-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feat, i) => (
                    <Motion key={i} variant={popUpslow}>
                        <Card
                            className="shadow-xl transition hover:scale-105 duration-300 h-[230] md:h-[200  ]
                            bg-white/5 backdrop-blur-md border border-white/10"
                        >
                            <CardContent>
                                {/* Gradient Icon */}
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white text-xl shadow-lg
                                    bg-gradient-to-r from-purple-400/50 to-blue-600/90"
                                >
                                    <FontAwesomeIcon icon={feat.icon} />
                                </div>

                                <h3 className="font-semibold text-lg mb-2 text-gray-200">
                                    {feat.title}
                                </h3>
                                <p className="text-gray-100/50 text-sm leading-relaxed">
                                    {feat.desc}
                                </p>
                            </CardContent>
                        </Card>
                    </Motion>
                ))}
            </div>

        </section>
    );
}
