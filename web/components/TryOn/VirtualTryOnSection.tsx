"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import toast from "react-hot-toast";
import BASE_URL, { authHeaders } from "@/config/api";
import Loader from "../Loader";
import { X, Sparkles } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faXmark,
  faImages,
} from "@fortawesome/free-solid-svg-icons";
import UpgradeModal from "../Modals/UpgradeModal";
import TryOnGalleryModal from "../Modals/Tryongallerymodal";

type Garment = {
  _id: string;
  name: string;
  imagePath: string;
};

type GeneratingPhase = "idle" | "scanning" | "generating" | "done";

export default function UploadTryOnSection() {
  const [loading, setLoading] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingPhase, setGeneratingPhase] =
    useState<GeneratingPhase>("idle");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeShownThisSession, setUpgradeShownThisSession] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      fetch(`${BASE_URL}/api/users/me`, {
        headers: authHeaders(),
      })
        .then((res) => {
          if (res.ok) setIsLoggedIn(true);
          else setIsLoggedIn(false);
        })
        .catch(() => setIsLoggedIn(false));
    };

    checkLogin();
    window.addEventListener("auth-changed", checkLogin);
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
    setGeneratingPhase("scanning");
    setGeneratedImage(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("garmentId", selectedGarment._id);

    const isAiGarment = localStorage.getItem("prefill_is_ai_garment");
    if (isAiGarment === "true") {
      formData.append("garmentImagePath", selectedGarment.imagePath);
      localStorage.removeItem("prefill_is_ai_garment");
    }

    const token = localStorage.getItem("token");

    // Simulate scanning phase before actual API call
    // The scanning phase ends when the AI validation part of the backend responds
    // We switch to "generating" phase once the request is underway
    setTimeout(() => {
      setGeneratingPhase("generating");
    }, 2000);

    const res = await fetch(`${BASE_URL}/api/users/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.reason) {
        switch (data.reason) {
          case "multiple_people":
            toast.error("Only one person allowed");
            break;
          case "selfie":
            toast.error("Image too close. Upload full body");
            break;
          case "not_full_body":
            toast.error("Please Upload Full body Image");
            break;
          case "no_person_detected":
            toast.error("No person detected");
            break;
          default:
            toast.error("Invalid image");
        }
      } else if (data.message === "Not enough points") {
        if (!upgradeShownThisSession) {
          setUpgradeShownThisSession(true);
          setShowUpgrade(true);
        }
      } else {
        toast.error(data.message);
      }

      setGenerating(false);
      setGeneratingPhase("idle");
      return;
    }

    setSelectedGarment(null);
    setGenerating(false);
    setGeneratingPhase("done");
    toast.success("Image & garment submitted successfully");
    window.dispatchEvent(new Event("auth-changed"));

    if (data.generatedImageUrl) {
      setGeneratedImage(data.generatedImageUrl);
    }

    if (data.pointsExhausted) {
      if (!upgradeShownThisSession) {
        setUpgradeShownThisSession(true);
        setShowUpgrade(true);
      }
    }
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

  useEffect(() => {
    const personBase64 = localStorage.getItem("prefill_person_base64");
    const personName = localStorage.getItem("prefill_person_name");
    const garmentId = localStorage.getItem("prefill_garment_id");
    const garmentImage = localStorage.getItem("prefill_garment_image");
    const garmentName = localStorage.getItem("prefill_garment_name");

    if (personBase64 && garmentId) {
      fetch(personBase64)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], personName || "photo.jpg", {
            type: blob.type,
          });
          setSelectedFile(file);
          setUploadedImage(personBase64);
        });

      if (garmentId && garmentImage && garmentName) {
        setSelectedGarment({
          _id: garmentId,
          name: garmentName,
          imagePath: garmentImage,
        });
      }

      localStorage.removeItem("prefill_person_base64");
      localStorage.removeItem("prefill_person_name");
      localStorage.removeItem("prefill_garment_id");
      localStorage.removeItem("prefill_garment_image");
      localStorage.removeItem("prefill_garment_name");
    }
  }, []);

  if (loading) return <Loader />;

  const buttonLabel = () => {
    if (generatingPhase === "scanning") {
      return (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
          Scanning Image...
        </>
      );
    }
    if (generatingPhase === "generating") {
      return (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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
          Generating Image...
        </>
      );
    }
    return "✨ Try On";
  };

  return (
    <section className="w-full pt-22 md:h-[calc(100vh-65px)] overflow-y-auto flex flex-col overflow-hidden px-5 md:px-12 xl:px-20  md:py-0">
      <div className="text-center mb-3">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500/65 to-blue-600/85 bg-clip-text text-transparent">
          Virtual Try On
        </h1>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex flex-col gap-3 h-[100vh] md:hidden mb-5 ">
        {/* Mobile: Garment strip — horizontal scroll */}
        <Card className="flex-shrink-0 rounded-2xl py-2 px-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {garments.map((g) => (
              <img
                key={g._id}
                src={g.imagePath}
                alt={g.name}
                onClick={() => !generating && setSelectedGarment(g)}
                className={`flex-shrink-0 w-[85px] h-[135px] rounded-xl object-cover cursor-pointer transition hover:scale-105 duration-200
            ${selectedGarment?._id === g._id ? "ring-2 ring-white" : "opacity-80"}`}
              />
            ))}
          </div>
        </Card>

        {/* Mobile: Upload + Selected Garment */}
        <div className="grid grid-cols-2 gap-3 flex-shrink-0 h-[35vh] sm:h-[40vh] md:h-[40vh]">
          {/* Upload */}
          <Card className="relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-md overflow-hidden rounded-2xl">
            <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
              {uploadedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={uploadedImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                  {!generating && (
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center px-4">
                  <h3 className="font-semibold text-white text-sm">
                    Upload Person
                  </h3>
                  <p className="text-gray-500 text-xs mb-3">png, jpg, jpeg</p>

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
                    <a href="/signin" className="text-xs text-[#A06CE3] mt-1">
                      Sign in to upload
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Selected Garment */}
          <Card className="relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-md overflow-hidden rounded-2xl">
            <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
              {selectedGarment ? (
                <div className="relative w-full h-full">
                  <img
                    src={selectedGarment.imagePath}
                    alt={selectedGarment.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                  {!generating && (
                    <button
                      onClick={() => setSelectedGarment(null)}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Select garment</p>
              )}
            </div>
          </Card>
        </div>

        {/* Try On Button */}
        <Button
          disabled={!isLoggedIn || generating}
          onClick={handleImageCheck}
          className="flex-shrink-0 w-full py-5 rounded-full text-[#F5F5DC]
    bg-gradient-to-r from-purple-400/50 to-blue-600/90"
        >
          {buttonLabel()}
        </Button>
        <div className="flex justify-center">
          {isLoggedIn && (
            <button
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-[10px]"
            >
              <FontAwesomeIcon icon={faImages} className="text-[9px]" />
              View my Try-On's
            </button>
          )}
        </div>

        {/* ⭐ FIXED: LARGE PREVIEW CARD (DESKTOP-LIKE FEEL) */}
        <Card
          className="
    flex-1 
    min-h-[55vh] 
    sm:min-h-[70vh] 
    md:min-h-[75vh]
    rounded-2xl 
    bg-white/5 backdrop-blur-md 
    border border-white/10 
    shadow-lg 
    overflow-hidden 
    relative 
    flex items-center justify-center
    mb-5
  "
        >
          {/* INNER DASHED BOX */}
          <div className="absolute inset-3 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
            {generatedImage ? (
              <>
                <img
                  src={generatedImage}
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />

                <div className="absolute top-2 right-2 z-10 flex gap-2">
                  <a
                    href={generatedImage}
                    download="wearify-tryon.jpg"
                    className="w-7 h-7 rounded-full bg-black/60 hover:bg-green-500 flex items-center justify-center"
                  >
                    <FontAwesomeIcon
                      icon={faDownload}
                      className="w-3 h-3 text-white"
                    />
                  </a>

                  <button
                    onClick={() => setGeneratedImage(null)}
                    className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center"
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="w-3 h-3 text-white"
                    />
                  </button>
                </div>
              </>
            ) : generating ? (
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-400/60 animate-pulse" />
                <p className="text-white/30 text-xs">
                  {generatingPhase === "scanning"
                    ? "Scanning Image..."
                    : "Generating Image..."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-gray-500 text-xs text-center">
                  Generated image preview
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 h-[calc(100vh-165px)] items-stretch">
        {/* 1️⃣ GARMENTS GRID */}
        <div className="h-full min-h-0">
          <Card className="h-full rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
            <CardContent className="p-3 h-full overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {garments.map((g) => (
                  <img
                    key={g._id}
                    src={g.imagePath}
                    alt={g.name}
                    onClick={() => !generating && setSelectedGarment(g)}
                    className={`w-full aspect-[2/3] rounded-xl object-cover cursor-pointer
                ${
                  selectedGarment?._id === g._id
                    ? "ring-2 ring-white"
                    : "opacity-80 hover:opacity-100"
                }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2️⃣ UPLOAD PERSON */}
        <div className="h-full min-h-0">
          <Card className="h-full relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
              {uploadedImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={uploadedImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                  {!generating && (
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-center px-4">
                  <h3 className="font-semibold text-white text-sm">
                    Upload Person
                  </h3>
                  <p className="text-gray-500 text-xs mb-3">png, jpg, jpeg</p>

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
                    <a href="/signin" className="text-xs text-[#A06CE3] mt-1">
                      Sign in to upload
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 3️⃣ SELECTED GARMENT */}
        <div className="h-full min-h-0">
          <Card className="h-full relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
              {selectedGarment ? (
                <div className="relative w-full h-full">
                  <img
                    src={selectedGarment.imagePath}
                    alt={selectedGarment.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  />
                  {!generating && (
                    <button
                      onClick={() => setSelectedGarment(null)}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="font-semibold text-white text-sm">
                    Selected Garment
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Choose from left panel
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 4️⃣ GENERATED RESULT */}
        <div className="h-full min-h-0 flex flex-col gap-2">
          <Card className="flex-1 relative rounded-3xl flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center">
              {generatedImage ? (
                <>
                  <img
                    src={generatedImage}
                    alt="generated"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  />

                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <a
                      href={generatedImage}
                      download="wearify-tryon.jpg"
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-green-500 flex items-center justify-center"
                    >
                      <FontAwesomeIcon
                        icon={faDownload}
                        className="w-3 h-3 text-white"
                      />
                    </a>

                    <button
                      onClick={() => setGeneratedImage(null)}
                      className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center"
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="w-3 h-3 text-white"
                      />
                    </button>
                  </div>
                </>
              ) : generating ? (
                <div className="flex flex-col items-center gap-3">
                  <Sparkles className="w-7 h-7 text-purple-400/60 animate-pulse" />
                  <p className="text-white/30 text-sm">
                    {generatingPhase === "scanning"
                      ? "Scanning Image..."
                      : "Generating Image..."}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center">
                  Generated image preview
                </p>
              )}
            </div>
          </Card>

          {isLoggedIn && (
            <button
              onClick={() => setShowGallery(true)}
              className="text-white/40 hover:text-white/80 text-xs text-center"
            >
              View my Try-On's
            </button>
          )}
          <Button
            disabled={!isLoggedIn || generating}
            onClick={handleImageCheck}
            className="w-full py-5 rounded-full text-[#F5F5DC] shadow-xl
      bg-gradient-to-r from-purple-400/50 to-blue-600/90"
          >
            {buttonLabel()}
          </Button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          setUpgradeShownThisSession(false);
        }}
      />

      <TryOnGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
      />
    </section>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/ui/button";
// import { Card, CardContent } from "@/ui/card";
// import { Input } from "@/ui/input";
// import toast from "react-hot-toast";
// import BASE_URL, { authHeaders } from "@/config/api";
// import Loader from "../Loader";
// import { X } from "lucide-react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faDownload,
//   faXmark,
//   faImages,
// } from "@fortawesome/free-solid-svg-icons";
// import UpgradeModal from "../Modals/UpgradeModal";
// import TryOnGalleryModal from "../Modals/Tryongallerymodal";

// type Garment = {
//   _id: string;
//   name: string;
//   imagePath: string;
// };

// export default function UploadTryOnSection() {
//   const [loading, setLoading] = useState(true);
//   const [uploadedImage, setUploadedImage] = useState<string | null>(null);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [garments, setGarments] = useState<Garment[]>([]);
//   const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [generating, setGenerating] = useState(false);
//   const [generatedImage, setGeneratedImage] = useState<string | null>();
//   const [showUpgrade, setShowUpgrade] = useState(false);
//   const [upgradeShownThisSession, setUpgradeShownThisSession] = useState(false);
//   const [showGallery, setShowGallery] = useState(false); // ← added

//   useEffect(() => {
//     const checkLogin = () => {
//       fetch(`${BASE_URL}/api/users/me`, {
//         headers: authHeaders(),
//       })
//         .then((res) => {
//           if (res.ok) setIsLoggedIn(true);
//           else setIsLoggedIn(false);
//         })
//         .catch(() => setIsLoggedIn(false));
//     };

//     checkLogin();

//     window.addEventListener("auth-changed", checkLogin);
//     return () => window.removeEventListener("auth-changed", checkLogin);
//   }, []);

//   const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files?.[0]) return;
//     const file = e.target.files[0];
//     setSelectedFile(file);
//     setUploadedImage(URL.createObjectURL(file));
//   };

//   const handleImageCheck = async () => {
//     if (!uploadedImage) {
//       toast.error("Please upload your photo");
//       return;
//     }
//     if (!selectedGarment) {
//       toast.error("Please select a garment");
//       return;
//     }
//     if (!selectedFile) {
//       toast.error("File missing");
//       return;
//     }

//     setGenerating(true);

//     const formData = new FormData();
//     formData.append("image", selectedFile);
//     formData.append("garmentId", selectedGarment._id);

//     // If garment came from AI suggestion, send its image URL as fallback
//     const isAiGarment = localStorage.getItem("prefill_is_ai_garment");
//     if (isAiGarment === "true") {
//       formData.append("garmentImagePath", selectedGarment.imagePath);
//       localStorage.removeItem("prefill_is_ai_garment");
//     }

//     const token = localStorage.getItem("token");
//     const res = await fetch(`${BASE_URL}/api/users/generate`, {
//       method: "POST",
//       headers: { Authorization: `Bearer ${token}` },
//       body: formData,
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       if (data.reason) {
//         switch (data.reason) {
//           case "multiple_people":
//             toast.error("Only one person allowed");
//             break;
//           case "selfie":
//             toast.error("Image too close. Upload full body");
//             break;
//           case "not_full_body":
//             toast.error("Please Upload Full body Image");
//             break;
//           case "no_person_detected":
//             toast.error("No person detected");
//             break;
//           default:
//             toast.error("Invalid image");
//         }
//       } else if (data.message === "Not enough points") {
//         if (!upgradeShownThisSession) {
//           setUpgradeShownThisSession(true);
//           setShowUpgrade(true);
//         }
//       } else {
//         toast.error(data.message);
//       }

//       setGenerating(false);
//       return;
//     }

//     setSelectedGarment(null);
//     setGenerating(false);
//     toast.success("Image & garment submitted successfully");
//     window.dispatchEvent(new Event("auth-changed"));

//     if (data.pointsExhausted) {
//       if (!upgradeShownThisSession) {
//         setUpgradeShownThisSession(true);
//         setShowUpgrade(true);
//       }
//     }
//   };

//   useEffect(() => {
//     setLoading(true);
//     fetch(`${BASE_URL}/api/garments`)
//       .then(async (res) => {
//         if (!res.ok) throw new Error("Garments API failed");
//         const data = await res.json();
//         setGarments(data);
//       })
//       .catch((err) => console.error("❌ Garments fetch error:", err))
//       .finally(() => setLoading(false));
//   }, []);

//   useEffect(() => {
//     const personBase64 = localStorage.getItem("prefill_person_base64");
//     const personName = localStorage.getItem("prefill_person_name");
//     const garmentId = localStorage.getItem("prefill_garment_id");
//     const garmentImage = localStorage.getItem("prefill_garment_image");
//     const garmentName = localStorage.getItem("prefill_garment_name");

//     if (personBase64 && garmentId) {
//       // Rebuild a File object from base64 so selectedFile is usable
//       fetch(personBase64)
//         .then((r) => r.blob())
//         .then((blob) => {
//           const file = new File([blob], personName || "photo.jpg", {
//             type: blob.type,
//           });
//           setSelectedFile(file);
//           setUploadedImage(personBase64);
//         });

//       // Pre-select the garment
//       if (garmentId && garmentImage && garmentName) {
//         setSelectedGarment({
//           _id: garmentId,
//           name: garmentName,
//           imagePath: garmentImage,
//         });
//       }

//       // Clear localStorage after loading
//       localStorage.removeItem("prefill_person_base64");
//       localStorage.removeItem("prefill_person_name");
//       localStorage.removeItem("prefill_garment_id");
//       localStorage.removeItem("prefill_garment_image");
//       localStorage.removeItem("prefill_garment_name");
//     }
//   }, []);

//   if (loading) return <Loader />;

//   return (
//     <section className="w-full px-6 md:px-12 xl:px-20 flex flex-col gap-5 min-h-[calc(100vh-120px)]">
//       <div
//         className="grid grid-cols-1 md:grid-cols-[2fr_1fr] xl:grid-cols-[2.4fr_1fr]
//        max-w-[1600px] 2xl:max-w-[1800px] w-full mx-auto gap-6 flex-1"
//       >
//         {/* LEFT */}
//         <div className="flex flex-col gap-5">
//           <Card className="rounded-2xl 2xl:min-h-[170px] p-3 max-w-xxl hover:scale-105 duration-300 transition shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
//             <CardContent className="flex gap-3 overflow-x-scroll no-scrollbar">
//               {garments.map((g) => (
//                 <img
//                   key={g._id}
//                   src={g.imagePath}
//                   alt={g.name}
//                   onClick={() => !generating && setSelectedGarment(g)}
//                   className={`w-[80px] h-[135px] md:h-[115px] 2xl:min-h-[150px] rounded-xl object-cover cursor-pointer
//                     transition hover:scale-110 duration-300
//                     ${selectedGarment?._id === g._id ? "ring-4 ring-[#FFFFFF]" : ""}
//                   `}
//                 />
//               ))}
//             </CardContent>
//           </Card>

//           {/* Upload */}
//           <Card className="max-w-xxl p-0 bg-transparent border-0 shadow-none">
//             <div className="grid grid-cols-2 gap-6">
//               {/* UPLOAD PERSON CARD */}
//               <Card className="relative h-[250px] md:h-[363px] 2xl:min-h-[450px] py-0 md:py-5 flex items-center justify-center hover:scale-105 duration-300 transition bg-white/5 backdrop-blur-md border border-white/10">
//                 <div className="w-full md:w-[50%] h-full border-2 md:border-1 border-dashed border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
//                   {uploadedImage ? (
//                     <div className="relative w-full h-full">
//                       <img
//                         src={uploadedImage}
//                         alt=""
//                         className="absolute inset-0 w-full h-full object-cover rounded-xl"
//                       />
//                       {generating ? (
//                         " "
//                       ) : (
//                         <button
//                           onClick={() => {
//                             setUploadedImage(null);
//                             setSelectedFile(null);
//                           }}
//                           className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition duration-200 cursor-pointer"
//                         >
//                           <X className="w-4 h-4 text-white" />
//                         </button>
//                       )}
//                     </div>
//                   ) : (
//                     <>
//                       <h3 className="font-semibold mb-1 items-center text-white">
//                         Upload Person
//                       </h3>
//                       <p className="text-gray-500 text-xs mb-8">
//                         png , jpg , jpeg
//                       </p>
//                       <label
//                         className={`font-semibold text-sm ${isLoggedIn ? "text-[#A06CE3] cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
//                       >
//                         <Input
//                           type="file"
//                           className="hidden"
//                           disabled={!isLoggedIn}
//                           onChange={handleUpload}
//                         />
//                         Select Image
//                       </label>
//                       {!isLoggedIn && (
//                         <a href="/signin" className="text-xs text-[#A06CE3]">
//                           Sign in to upload
//                         </a>
//                       )}
//                     </>
//                   )}
//                 </div>
//               </Card>

//               {/* SELECTED GARMENT CARD */}
//               <Card className="relative h-[250px] md:h-[363px] 2xl:min-h-[450px] py-0 md:py-5 flex items-center justify-center text-center rounded-2xl shadow-md hover:scale-105 duration-300 transition bg-white/5 backdrop-blur-md border border-white/10">
//                 <div className="w-full md:w-[50%] h-full border-2 md:border-1 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center">
//                   {selectedGarment ? (
//                     <div className="relative w-full h-full">
//                       <img
//                         src={selectedGarment.imagePath}
//                         alt={selectedGarment.name}
//                         className="absolute inset-0 w-full h-full object-cover rounded-xl"
//                       />
//                       {generating ? (
//                         " "
//                       ) : (
//                         <button
//                           onClick={() => setSelectedGarment(null)}
//                           className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition duration-200 cursor-pointer"
//                         >
//                           <X className="w-4 h-4 text-white" />
//                         </button>
//                       )}
//                     </div>
//                   ) : (
//                     <>
//                       <h3 className="font-semibold mb-3 text-white">
//                         Selected Garment
//                       </h3>
//                       <p className="text-gray-400 text-xs">Choose from above</p>
//                     </>
//                   )}
//                 </div>
//               </Card>
//             </div>
//           </Card>
//         </div>

//         {/* RIGHT COLUMN */}
//         <div className="flex flex-col items-center gap-4 h-full">
//           <Card className="rounded-3xl w-full p-7 h-[400px] md:h-[450px] 2xl:min-h-[580px] flex items-center justify-center hover:scale-105 duration-300 transition shadow-xl bg-white/5 backdrop-blur-md border border-white/10">
//             <div className="relative w-full h-full border-2 border-dashed border-white/30 rounded-2xl overflow-hidden flex items-center justify-center">
//               {generatedImage ? (
//                 <>
//                   <img
//                     src={generatedImage}
//                     alt="generated"
//                     className="absolute inset-0 w-full h-full object-cover rounded-2xl"
//                   />
//                   <div className="absolute top-2 right-2 z-10 flex gap-2">
//                     <a
//                       href={generatedImage}
//                       download="wearify-tryon.jpg"
//                       className="w-7 h-7 rounded-full bg-black/60 hover:bg-green-500 flex items-center justify-center transition duration-200 cursor-pointer"
//                     >
//                       <FontAwesomeIcon
//                         icon={faDownload}
//                         className="w-3 h-3 text-white"
//                       />
//                     </a>
//                     <button
//                       onClick={() => setGeneratedImage(null)}
//                       className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition duration-200 cursor-pointer"
//                     >
//                       <FontAwesomeIcon
//                         icon={faXmark}
//                         className="w-3 h-3 text-white"
//                       />
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 <p className="text-gray-500 text-sm text-center">
//                   Generated image preview
//                 </p>
//               )}
//             </div>
//           </Card>

//           <Button
//             disabled={!isLoggedIn || generating}
//             className={`w-full py-6 rounded-full text-[#F5F5DC] shadow-xl
//             hover:scale-105 duration-300 transition hover:from-[#4287f5] hover:to-[#6a339e]
//             disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-auto
//             ${
//               isLoggedIn
//                 ? "bg-gradient-to-r from-purple-400/50 to-blue-600/90 cursor-pointer"
//                 : "bg-gradient-to-r from-purple-400/50 to-blue-600/90"
//             }`}
//             onClick={handleImageCheck}
//           >
//             {generating ? (
//               <>
//                 <svg
//                   className="animate-spin w-4 h-4"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v8z"
//                   />
//                 </svg>
//                 Generating...
//               </>
//             ) : (
//               "✨ Try On"
//             )}
//           </Button>

// {/* ← View My Try-Ons trigger — only shown when logged in */}
// {isLoggedIn && (
//   <button
//     onClick={() => setShowGallery(true)}
//     className="flex items-center gap-2 text-white/40 hover:text-white/80 text-xs transition duration-200 cursor-pointer mb-5"
//   >
//     <FontAwesomeIcon icon={faImages} className="text-[10px]" />
//     View my Try-On's
//   </button>
// )}
//         </div>
//       </div>

//       <UpgradeModal
//         isOpen={showUpgrade}
//         onClose={() => {
//           setShowUpgrade(false);
//           setUpgradeShownThisSession(false);
//         }}
//       />

//       {/* ← Gallery Modal */}
//       <TryOnGalleryModal
//         isOpen={showGallery}
//         onClose={() => setShowGallery(false)}
//       />
//     </section>
//   );
// }
