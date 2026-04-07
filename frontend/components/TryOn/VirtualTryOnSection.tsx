"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import toast from "react-hot-toast";
import BASE_URL from "@/config/api";
import Loader from "../Loader";
import { X } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faXmark } from "@fortawesome/free-solid-svg-icons";

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
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>();
  // "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400" // ← hardcoded for now, remove later

  useEffect(() => {
    const checkLogin = () => {
      fetch(`${BASE_URL}/api/users/me`, { credentials: "include" })
        .then((res) => {
          if (res.ok) setIsLoggedIn(true);
          else setIsLoggedIn(false);
        })
        .catch(() => setIsLoggedIn(false));
    };

    checkLogin(); // run on mount

    window.addEventListener("auth-changed", checkLogin); // ← listen for changes
    return () => window.removeEventListener("auth-changed", checkLogin);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setUploadedImage(URL.createObjectURL(file));
  };

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

    setGenerating(true);

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
      setGenerating(false);
      return;
    }

    setSelectedGarment(null);
    setGenerating(false);

    toast.success("Image & garment submitted successfully");

    window.dispatchEvent(new Event("auth-changed"));
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/garments`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Garments API failed");
        const data = await res.json();
        setGarments(data);
      })
      .catch((err) => console.error("❌ Garments fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <section className="w-full px-6 md:px-12 xl:px-20 flex flex-col gap-5 min-h-[calc(100vh-120px)]">
      <div
        className="grid grid-cols-1 md:grid-cols-[2fr_1fr] xl:grid-cols-[2.4fr_1fr]
       max-w-[1600px] 2xl:max-w-[1800px] w-full mx-auto gap-6 flex-1"
      >
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          <Card className="rounded-2xl 2xl:min-h-[170px] p-3 max-w-xxl hover:scale-105 duration-300 transition shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
            <CardContent className="flex gap-3 overflow-x-scroll no-scrollbar">
              {garments.map((g) => (
                <img
                  key={g._id}
                  src={g.imagePath}
                  alt={g.name}
                  onClick={() => !generating && setSelectedGarment(g)}
                  className={`w-[80px] h-[135px] md:h-[115px] 2xl:min-h-[150px] rounded-xl object-cover cursor-pointer
                    transition hover:scale-110 duration-300
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
              <Card className="relative h-[250px] md:h-[363px] 2xl:min-h-[450px] py-0 md:py-5 flex items-center justify-center hover:scale-105 duration-300 transition bg-white/5 backdrop-blur-md border border-white/10">
                <div className="w-full md:w-[50%] h-full border-2 md:border-1 border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                  {uploadedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={uploadedImage}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover rounded-xl"
                      />
                      {generating ? (
                        " "
                      ) : (
                        <button
                          onClick={() => {
                            setUploadedImage(null);
                            setSelectedFile(null);
                          }}
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition duration-200 cursor-pointer"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-1 items-center text-white">
                        Upload Person
                      </h3>
                      <p className="text-gray-500 text-xs mb-8">
                        png , jpg , jpeg
                      </p>
                      <label
                        className={`font-semibold text-sm ${isLoggedIn ? "text-[#A06CE3] cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
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
                        
                          <a
                            href="/signin"
                            className="text-xs text-[#A06CE3] underline"
                          >
                            Sign in to upload
                          </a>
                      )}
                    </>
                  )}
                </div>
              </Card>

              {/* SELECTED GARMENT CARD */}
              <Card className="relative h-[250px] md:h-[363px] 2xl:min-h-[450px] py-0 md:py-5 flex items-center justify-center text-center rounded-2xl shadow-md hover:scale-105 duration-300 transition bg-white/5 backdrop-blur-md border border-white/10">
                <div className="w-full md:w-[50%] h-full border-2 md:border-1 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center">
                  {selectedGarment ? (
                    <div className="relative w-full h-full">
                      <img
                        src={selectedGarment.imagePath}
                        alt={selectedGarment.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl"
                      />

                      {generating ? (
                        " "
                      ) : (
                        <button
                          onClick={() => setSelectedGarment(null)}
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition duration-200 cursor-pointer"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-3 text-white">
                        Selected Garment
                      </h3>
                      <p className="text-gray-400 text-xs">Choose from above</p>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col items-center gap-6 h-full">
          <Card className="rounded-3xl w-full p-7 h-[400px] md:h-[450px] 2xl:min-h-[580px] flex items-center justify-center hover:scale-105 duration-300 transition shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
            <div className="relative w-full h-full border-2 border-dashed border-white/30 rounded-2xl overflow-hidden flex items-center justify-center">
              {generatedImage ? (
                <>
                  {/* Generated image */}
                  <img
                    src={generatedImage}
                    alt="generated"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  />
                  {/* X + Download buttons */}
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    {/* Download */}
                    <a
                      href={generatedImage}
                      download="wearify-tryon.jpg"
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-green-500 flex items-center justify-center transition duration-200 cursor-pointer"
                    >
                      <FontAwesomeIcon
                        icon={faDownload}
                        className="w-3 h-3 text-white"
                      />
                    </a>
                    {/* Remove */}
                    <button
                      onClick={() => setGeneratedImage(null)}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition duration-200 cursor-pointer"
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="w-3 h-3 text-white"
                      />
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm text-center">
                  Generated image preview
                </p>
              )}
            </div>
          </Card>

          <Button
            disabled={!isLoggedIn || generating}
            className={`w-full py-6 rounded-full text-[#F5F5DC] shadow-xl mb-5
            hover:scale-105 duration-300 transition hover:from-[#4287f5] hover:to-[#6a339e]
            disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-auto
            ${
              isLoggedIn
                ? "bg-gradient-to-r from-purple-400/50 to-blue-600/90 cursor-pointer"
                : "bg-gradient-to-r from-purple-400/50 to-blue-600/90"
            }`}
            onClick={handleImageCheck}
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Generating...
              </>
            ) : (
              "✨ Try On"
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
