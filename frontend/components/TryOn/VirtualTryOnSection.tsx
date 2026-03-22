"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import toast from "react-hot-toast";
import BASE_URL from "@/config/api";
import Loader from "../Loader";

type Garment = {
  _id: string;
  name: string;
  imagePath: string;
};

export default function UploadTryOnSection() {
  const [loading, setLoading] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/users/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) setIsLoggedIn(true);
        else setIsLoggedIn(false);
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Upload handler
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];

    setSelectedFile(file); // store real file
    setUploadedImage(URL.createObjectURL(file)); // preview
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

    if (!selectedFile) {
      toast.error("File missing");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("garmentId", selectedGarment._id);

    console.log(selectedFile.size / 1024 / 1024, "MB");

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
    setSelectedFile(null);

    toast.success("Image & garment submitted successfully");

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  useEffect(() => {
    console.log("📡 Fetching garments...");
    setLoading(true);

    fetch(`${BASE_URL}/api/garments`)
      .then(async (res) => {
        console.log("📥 Garments response status:", res.status);

        if (!res.ok) {
          throw new Error("Garments API failed");
        }

        const data = await res.json();
        console.log("✅ Garments data:", data);
        setGarments(data);
      })
      .catch((err) => {
        console.error("❌ Garments fetch error:", err);
      })
      .finally(() => {
        console.log("🧹 Stopping loader");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <section className="w-full px-6 md:px-12 xl:px-20 flex flex-col gap-5 min-h-[calc(100vh-120px)]">
      <div
        className="grid grid-cols-1 md:grid-cols-[2fr_1fr] xl:grid-cols-[2.4fr_1fr]
       max-w-[1600px] 2xl:max-w-[1800px] w-full mx-auto gap-6 flex-1"
      >
        {/* LEFT */}
        <div className="flex flex-col gap-6 ">
          <Card className=" rounded-2xl 2xl:min-h-[170px] p-3 max-w-xxl hover:scale-105 duration-300 transition shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
            <CardContent className="flex gap-3 overflow-x-scroll no-scrollbar">
              {garments.map((g) => (
                <img
                  key={g._id}
                  src={g.imagePath}
                  alt={g.name}
                  onClick={() => setSelectedGarment(g)}
                  className={`w-[90px] h-[110px] 2xl:min-h-[150px] rounded-xl object-cover cursor-pointer
      transition hover:scale-110 duration-300 transition
      ${selectedGarment?._id === g._id ? "ring-4 ring-[#FFFFFF]" : ""}
    `}
                />
              ))}
            </CardContent>
          </Card>

          {/* Upload */}
          <Card className="max-w-xxl p-0 bg-transparent border-0 shadow-none">
            <div className="grid grid-cols-2 gap-6">
              {/* UPLOAD PERSON CARD */}
              <Card
                className="relative h-[333px] 2xl:min-h-[450px] p-5 rounded-2xl shadow-md 
              hover:scale-105 duration-300 transition bg-white/5 backdrop-blur-md border border-white/10"
              >
                <div className="w-full h-full text-center border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center">
                  {uploadedImage ? (
                    <div className="max-h-full max-w-full rounded-xl overflow-hidden">
                      <Image
                        src={uploadedImage}
                        alt=""
                        width={500}
                        height={500}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-1 items-center ">
                        Upload Person
                      </h3>
                      <p className="text-gray-500 text-xs mb-8 ">
                        png , jpg , jpeg
                      </p>

                      <label
                        className={`font-semibold text-sm ${
                          isLoggedIn
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
                          Login required
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Card>

              {/* SELECTED GARMENT CARD */}
              <Card
                className="relative h-[333px] 2xl:min-h-[450px] p-5 flex  items-center justify-center text-center rounded-2xl shadow-md 
                hover:scale-105 duration-300 transition bg-white/5 backdrop-blur-md border border-white/10"
              >
                <div className="w-full h-full border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center">
                  {selectedGarment ? (
                    <img
                      src={selectedGarment.imagePath}
                      alt={selectedGarment.name}
                      className="w-[140px] h-[200px] object-cover rounded-xl border shadow"
                    />
                  ) : (
                    <>
                      <h3 className="font-semibold mb-3">Selected Garment</h3>
                      <p className="text-gray-400 text-xs">Choose from above</p>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col items-center gap-6 h-full ">
          <Card
            className="rounded-3xl w-full p-5 h-[420px] 2xl:min-h-[580px] flex items-center justify-center
    hover:scale-105 duration-300 transition shadow-xl 
    bg-white/5 backdrop-blur-md border border-white/10"
          >
            <div className="w-full h-full border-2 border-dashed border-white/30 rounded-2xl flex items-center justify-center">
              <p className="text-gray-500 text-sm text-center">
                Generated image preview
              </p>
            </div>
          </Card>

          <Button
            disabled={!isLoggedIn}
            className={`w-full py-6 rounded-full text-[#F5F5DC] shadow-xl mb-5
      hover:scale-105 duration-300 transition hover:from-[#4287f5] hover:to-[#6a339e]
      disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-auto  
      ${
        isLoggedIn
          ? "bg-gradient-to-r from-purple-400/50 to-blue-600/90 cursor-pointer"
          : "bg-gradient-to-r from-purple-400/50 to-blue-600/90  "
      }`}
            onClick={handleImageCheck}
          >
            Try On
          </Button>
        </div>
      </div>
    </section>
  );
}
