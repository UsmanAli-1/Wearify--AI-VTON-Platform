"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import toast from "react-hot-toast";
import Motion from "@/components/Motion";
import { fadeUp } from "@/lib/motion";
import { fadeIn } from "@/lib/motion";
import { popUp } from "@/lib/motion";
import { popUpslow } from "@/lib/motion";
import BASE_URL from "@/config/api";


type Garment = {
    _id: string;
    name: string;
    imagePath: string;
};



export default function UploadTryOnSection() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [garments, setGarments] = useState<Garment[]>([]);
    const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);




    // Check login ONCE
    useEffect(() => {
        fetch(`${BASE_URL}/api/users/me`, {
            credentials: "include",
        })
            .then((res) => setIsLoggedIn(res.ok))
            .catch(() => setIsLoggedIn(false));
    }, []);




    // Upload handler
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const file = e.target.files[0];
        setUploadedImage(URL.createObjectURL(file));
    };



    // check image upload 
    const handleImageCheck = async () => {
        if (!uploadedImage) {
            toast.error("Please upload your photo");
            return;
        }

        if (!selectedGarment) {
            toast.error("Please select a garment");
            return;
        }

        const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
        if (!fileInput?.files?.[0]) {
            toast.error("File missing");
            return;
        }

        const formData = new FormData();
        formData.append("image", fileInput.files[0]);
        formData.append("garmentId", selectedGarment._id);

        const res = await fetch(`${BASE_URL}/api/users/generate`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            toast.error(data.message);
            return;
        }

        setUploadedImage(null);
        setSelectedGarment(null);

        toast.success("Image & garment submitted successfully");

        window.location.reload();
    };





    useEffect(() => {
        fetch(`${BASE_URL}/api/garments`)
            .then(res => res.json())
            .then(data => {
                // console.log("GARMENTS DATA:", data);
                setGarments(data);
            });
    }, []);



    return (
        <section className="w-full px-6 md:px-20 py-8 flex flex-col gap-5 bg-gradient-to-r  from-[#4F5D3A] to-[#6B7A4C]">
            <h1 className="m-auto md:text-5xl text-3xl font-bold text-[#1C1C1C]">
                <Motion variant={fadeIn}>
                    Virtual Try On
                </Motion>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LEFT */}
                <div className="flex flex-col gap-6">
                    <Motion variant={popUpslow}>
                        <Card className="bg-[#1C1C1C]/50 rounded-2xl p-3 max-w-xl hover:scale-105 duration-300 transition shadow-xl">
                            <CardContent className="flex gap-3 overflow-x-scroll no-scrollbar">
                                {garments.map((g) => (
                                    <img
                                        key={g._id}
                                        src={`${BASE_URL}/uploads/${g.imagePath}`}
                                        alt={g.name}
                                        onClick={() => setSelectedGarment(g)}
                                        className={`w-[80px] h-[110px] rounded-xl object-cover cursor-pointer
      transition hover:scale-110
      ${selectedGarment?._id === g._id ? "ring-4 ring-[#A06CE3]" : ""}
    `}
                                    />
                                ))}


                            </CardContent>
                        </Card>
                    </Motion>

                    {/* Upload */}
                    <Motion variant={popUp} >
                        <Card className="relative bg-[#F5F5DC] rounded-3xl p-4 md:p-6 h-[285px] flex flex-col items-center justify-center text-center max-w-xl hover:scale-105 duration-300 transition shadow-xl">
                            {isLoggedIn && (
                                <div className=" relative w-full h-full flex justify-between">
                                    <div className=" absolute z-10 w-17 h-25 md:w-18 md:h-20 lg:w-22 lg:h-30 left-0 top-0  ">
                                        {uploadedImage ? (
                                            <Image
                                                src={uploadedImage}
                                                alt=""
                                                width={100}
                                                height={100}
                                                className="object-contain rounded-xl border shadow-xl "
                                            />
                                        ) :
                                            <p className="border shadow-xl absolute z-10 w-17 h-25 md:w-18 md:h-20 lg:w-22 lg:h-30 left-0 top-0 rounded-xl text-gray-400/60 pt-9 text-xs md:text-sm ">selected image</p>
                                        }
                                    </div>
                                    {/* <div className=" border shadow-xl absolute z-10 w-17 h-25 md:w-18 md:h-20 lg:w-22 lg:h-30 right-0 top-0 rounded-xl text-gray-400/60 pt-9 text-xs md:text-sm">selected garment</div> */}
                                    <div className="absolute z-10 w-17 h-25 md:w-18 md:h-20 lg:w-22 lg:h-30 right-0 top-0">
                                        {selectedGarment ? (
                                            <img
                                                src={`${BASE_URL}/uploads/${selectedGarment.imagePath}`}
                                                alt={selectedGarment.name}
                                                className="w-full h-full object-cover rounded-xl border shadow-xl"
                                            />
                                        ) : (
                                            <p className="border shadow-xl w-full h-full rounded-xl text-gray-400/60 pt-9 text-xs md:text-sm text-center">
                                                selected garment
                                            </p>
                                        )}
                                    </div>

                                </div>
                            )}
                            <h3 className="font-semibold">Upload Your Photo</h3>
                            <p className="text-gray-500 text-xs">
                                PNG, JPG, JPEG up to 10MB
                            </p>

                            <label
                                className={`mt-3 font-semibold text-sm ${isLoggedIn
                                    ? "text-[#A06CE3] cursor-pointer"
                                    : "text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                <Input
                                    type="file"
                                    className="hidden"
                                    disabled={!isLoggedIn}
                                    onChange={handleUpload}
                                />
                                Select Image
                            </label>

                            {!isLoggedIn && (
                                <p className="text-xs text-red-500 mt-2">
                                    Login required to upload image
                                </p>
                            )}
                        </Card>
                    </Motion>
                </div>

                {/* RIGHT */}
                <Motion variant={popUp}>
                    <Card className="bg-[#F5F5DC] rounded-3xl p-6 h-[446px] flex items-center justify-center hover:scale-105 duration-300 transition shadow-xl">
                        <div className="w-full h-full border-2 border-dashed rounded-2xl flex items-center justify-center">
                            <p className="text-gray-500 text-sm text-center">
                                Upload image to preview
                            </p>
                        </div>
                    </Card>
                </Motion>
            </div>

            {/* Generate */}
            <div className="flex justify-center ">
                <Motion variant={fadeUp}>
                    <Button
                        disabled={!isLoggedIn}
                        className={`px-32 py-6 rounded-full text-[#F5F5DC] shadow-2xl hover:scale-105 duration-300 transition ${isLoggedIn
                            ? "bg-[#1C1C1C] cursor-pointer"
                            : "bg-[#1C1C1C] cursor-not-allowed"
                            }`}
                        onClick={handleImageCheck}
                    >
                        Generate
                    </Button>
                </Motion>
            </div>
        </section>
    );
}

