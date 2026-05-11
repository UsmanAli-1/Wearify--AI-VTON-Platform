"use client";

import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import toast from "react-hot-toast";
import BASE_URL, { authHeaders } from "@/config/api";
import { X, Sparkles } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faXmark,
  faImages,
  faShirt,
} from "@fortawesome/free-solid-svg-icons";
import UpgradeModal from "../Modals/UpgradeModal";
import TryOnGalleryModal from "../Modals/Tryongallerymodal";

type Garment = { _id: string; name: string; imagePath: string };
type GeneratingPhase = "idle" | "scanning" | "generating" | "done";

const SKELETON_COUNT = 16;

const SHIMMER_STYLE = `
@keyframes wearify-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes wearify-pulse {
  0%, 100% { opacity: 0.25; }
  50%       { opacity: 0.65; }
}
`;

export default function UploadTryOnSection() {
  const [loading, setLoading] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingPhase, setGeneratingPhase] = useState<GeneratingPhase>("idle");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeShownThisSession, setUpgradeShownThisSession] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [downloading, setDownloading] = useState(false); // ← new

  /* ── inject shimmer keyframes once ── */
  useEffect(() => {
    if (document.getElementById("wearify-shimmer-style")) return;
    const tag = document.createElement("style");
    tag.id = "wearify-shimmer-style";
    tag.textContent = SHIMMER_STYLE;
    document.head.appendChild(tag);
  }, []);

  /* ── auth check ── */
  useEffect(() => {
    const checkLogin = () =>
      fetch(`${BASE_URL}/api/users/me`, { headers: authHeaders() })
        .then((res) => setIsLoggedIn(res.ok))
        .catch(() => setIsLoggedIn(false));
    checkLogin();
    window.addEventListener("auth-changed", checkLogin);
    return () => window.removeEventListener("auth-changed", checkLogin);
  }, []);

  /* ── fetch garments ── */
  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/garments`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setGarments)
      .catch((err) => console.error("❌ Garments fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  /* ── AI-suggestion prefill ── */
  useEffect(() => {
    const b64 = localStorage.getItem("prefill_person_base64");
    const name = localStorage.getItem("prefill_person_name");
    const gId = localStorage.getItem("prefill_garment_id");
    const gImg = localStorage.getItem("prefill_garment_image");
    const gName = localStorage.getItem("prefill_garment_name");
    if (b64 && gId) {
      fetch(b64)
        .then((r) => r.blob())
        .then((blob) => {
          setSelectedFile(
            new File([blob], name || "photo.jpg", { type: blob.type }),
          );
          setUploadedImage(b64);
        });
      setSelectedGarment({ _id: gId, name: gName!, imagePath: gImg! });
      [
        "prefill_person_base64",
        "prefill_person_name",
        "prefill_garment_id",
        "prefill_garment_image",
        "prefill_garment_name",
      ].forEach((k) => localStorage.removeItem(k));
    }
  }, []);

  /* ── handlers ── */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadedImage(URL.createObjectURL(file));
  };

  // ── fetch → blob → trigger download (same approach as gallery modal, works for cross-origin Cloudinary URLs) ──
  const handleDownload = async (url: string) => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "wearify-tryon.jpg";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleImageCheck = async () => {
    if (!uploadedImage) return toast.error("Please upload your photo");
    if (!selectedGarment) return toast.error("Please select a garment");
    if (!selectedFile) return toast.error("File missing");

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

    setTimeout(() => setGeneratingPhase("generating"), 2000);

    const res = await fetch(`${BASE_URL}/api/users/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      const reasonMap: Record<string, string> = {
        multiple_people: "Only one person allowed",
        selfie: "Image too close. Upload full body",
        not_full_body: "Please Upload Full body Image",
        no_person_detected: "No person detected",
      };
      if (data.reason) toast.error(reasonMap[data.reason] ?? "Invalid image");
      else if (data.message === "Not enough points") {
        if (!upgradeShownThisSession) {
          setUpgradeShownThisSession(true);
          setShowUpgrade(true);
        }
      } else toast.error(data.message);
      setGenerating(false);
      setGeneratingPhase("idle");
      return;
    }

    if (data.resultImage) {
      setGeneratedImage(data.resultImage);
    }

    setSelectedGarment(null);
    setGenerating(false);
    setGeneratingPhase("done");
    toast.success("Try-on generated successfully!");
    window.dispatchEvent(new Event("auth-changed"));

    if (data.pointsExhausted && !upgradeShownThisSession) {
      setUpgradeShownThisSession(true);
      setShowUpgrade(true);
    }
  };

  /* ════════════════════════════════════════════
     Shared sub-components
  ════════════════════════════════════════════ */

  const RemoveBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition duration-200 cursor-pointer"
    >
      <X className="w-4 h-4 text-white" />
    </button>
  );

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  const buttonContent =
    generatingPhase === "scanning" ? (
      <><Spinner /> Scanning Image...</>
    ) : generatingPhase === "generating" ? (
      <><Spinner /> Generating Image...</>
    ) : (
      <>✨ Try On</>
    );

  const TryOnBtn = () => (
    <Button
      disabled={!isLoggedIn || generating}
      onClick={handleImageCheck}
      className="w-full py-5 rounded-full text-[#F5F5DC] shadow-xl gap-2
        hover:scale-[1.02] duration-300 transition
        disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-auto
        bg-gradient-to-r from-purple-400/50 to-blue-600/90"
    >
      {buttonContent}
    </Button>
  );

  const GalleryLink = () =>
    isLoggedIn ? (
      <button
        onClick={() => setShowGallery(true)}
        className="flex items-center justify-center gap-1.5 text-white/40 hover:text-white/80 text-[11px] transition duration-200 cursor-pointer"
      >
        <FontAwesomeIcon icon={faImages} className="text-[10px]" />
        View my Try-On's
      </button>
    ) : null;

  const SkeletonCard = ({ index, mobile }: { index: number; mobile?: boolean }) => (
    <div
      className={`relative flex flex-col items-center justify-center gap-1 rounded-xl overflow-hidden ${
        mobile ? "flex-shrink-0 w-[85px] h-[140px]" : "w-full aspect-[2/3]"
      }`}
      style={{
        background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%)",
        backgroundSize: "200% 100%",
        animation: `wearify-shimmer 1.5s ${index * 0.13}s infinite linear`,
      }}
    >
      <Sparkles
        className="w-4 h-4 text-purple-400/60"
        style={{ animation: `wearify-pulse 1.3s ${index * 0.13}s ease-in-out infinite` }}
      />
      <p
        className="text-white/20 text-[9px]"
        style={{ animation: `wearify-pulse 1.3s ${index * 0.13}s ease-in-out infinite` }}
      >
        Finding {index + 1}...
      </p>
    </div>
  );

  const EmptyCard = ({ index, mobile }: { index: number; mobile?: boolean }) => (
    <div
      className={`relative flex flex-col items-center justify-center gap-1 rounded-xl overflow-hidden opacity-30 ${
        mobile ? "flex-shrink-0 w-[85px] h-[140px]" : "w-full aspect-[2/3]"
      }`}
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
        <FontAwesomeIcon icon={faShirt} className="text-white/15" />
      </div>
      <p className="text-white/20 text-[10px]">Outfit {index + 1}</p>
    </div>
  );

  const GarmentGrid = () => (
    <>
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} index={i} />)
        : garments.map((g) => (
            <img
              key={g._id}
              src={g.imagePath}
              alt={g.name}
              onClick={() => !generating && setSelectedGarment(g)}
              className={`w-full aspect-[2/3] rounded-xl object-cover cursor-pointer transition hover:scale-105 duration-200
                ${selectedGarment?._id === g._id ? "ring-2 ring-white" : "opacity-75 hover:opacity-100"}`}
            />
          ))}
    </>
  );

  const GarmentStrip = () => (
    <>
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonCard key={i} index={i} mobile />)
        : garments.map((g) => (
            <img
              key={g._id}
              src={g.imagePath}
              alt={g.name}
              onClick={() => !generating && setSelectedGarment(g)}
              className={`flex-shrink-0 w-[85px] h-[140px] rounded-xl object-cover cursor-pointer transition hover:scale-105 duration-200
                ${selectedGarment?._id === g._id ? "ring-2 ring-white" : "opacity-75"}`}
            />
          ))}
    </>
  );

  /* ── generated preview inner ── */
  const GeneratedInner = () => (
    <div className="absolute inset-3 border-2 border-dashed border-white/20 rounded-2xl overflow-hidden flex items-center justify-center">
      {generatedImage ? (
        <>
          <img
            src={generatedImage}
            alt="generated"
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
          />
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            {/* ── download: fetch→blob same as gallery modal, works for cross-origin Cloudinary URLs ── */}
            <button
              onClick={() => handleDownload(generatedImage)}
              disabled={downloading}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-green-500 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
              title="Download"
            >
              {downloading ? (
                <svg className="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <FontAwesomeIcon icon={faDownload} className="w-3 h-3 text-white" />
              )}
            </button>
            <button
              onClick={() => setGeneratedImage(null)}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition cursor-pointer"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3 text-white" />
            </button>
          </div>
        </>
      ) : generating ? (
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400/60 animate-pulse" />
          <p className="text-white/30 text-xs text-center">
            {generatingPhase === "scanning" ? "Scanning Image..." : "Generating Image..."}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 text-xs text-center px-4">Generated image preview</p>
      )}
    </div>
  );

  const UploadCardInner = () => (
    <>
      {uploadedImage ? (
        <div className="relative w-full h-full">
          <img src={uploadedImage} alt="" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
          {!generating && (
            <RemoveBtn onClick={() => { setUploadedImage(null); setSelectedFile(null); }} />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 text-center px-3">
          <h3 className="font-semibold text-white text-sm">Upload Person</h3>
          <p className="text-gray-500 text-xs mb-2">png, jpg, jpeg</p>
          <label className={`font-semibold text-sm ${isLoggedIn ? "text-[#A06CE3] cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}>
            <Input type="file" className="hidden" disabled={!isLoggedIn} onChange={handleUpload} />
            Select Image
          </label>
          {!isLoggedIn && (
            <a href="/signin" className="text-xs text-[#A06CE3] mt-1">Sign in to upload</a>
          )}
        </div>
      )}
    </>
  );

  const GarmentCardInner = ({ hint }: { hint: string }) => (
    <>
      {selectedGarment ? (
        <div className="relative w-full h-full">
          <img
            src={selectedGarment.imagePath}
            alt={selectedGarment.name}
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
          />
          {!generating && <RemoveBtn onClick={() => setSelectedGarment(null)} />}
        </div>
      ) : (
        <div className="text-center px-3">
          <h3 className="font-semibold text-white text-sm">Selected Garment</h3>
          <p className="text-gray-400 text-xs mt-1">{hint}</p>
        </div>
      )}
    </>
  );

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <section className="w-full flex flex-col sm:h-[calc(100vh-35px)] md:h-[calc(100vh-65px)] sm:pt-20 md:pt-0 px-5 sm:px-5 md:px-12 xl:px-20 sm:overflow-hidden">
      {/* ══════════════════════════════
          MOBILE  (< sm, below 640px)
      ══════════════════════════════ */}
      <div className="flex flex-col gap-3 pt-22 pb-5 sm:hidden overflow-y-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500/55 to-blue-600/95 bg-clip-text text-transparent">
            Virtual Try On
          </h1>
        </div>

        <Card className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden py-2 px-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
            <GarmentStrip />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 h-[52vw] min-h-[280px] max-h-[340px]">
          <Card className="relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden h-full">
            <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
              <UploadCardInner />
            </div>
          </Card>
          <Card className="relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden h-full">
            <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
              <GarmentCardInner hint="Choose from above" />
            </div>
          </Card>
        </div>

        <TryOnBtn />
        <GalleryLink />

        <Card className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl h-[800vw] min-h-[420px] max-h-[480px]">
          <GeneratedInner />
        </Card>
      </div>

      {/* ══════════════════════════════
          DESKTOP / TABLET  (≥ sm)
      ══════════════════════════════ */}
      <div className="hidden sm:flex flex-col gap-3 h-full md:pb-10">
        <div className="text-center flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500/55 to-blue-600/95 bg-clip-text text-transparent">
            Virtual Try On
          </h1>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-hidden">
          <Card className="h-full rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
            <CardContent className="p-2 md:p-3 h-full overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                <GarmentGrid />
              </div>
            </CardContent>
          </Card>

          <div className="lg:hidden h-full flex flex-col gap-3 min-h-0">
            <Card className="flex-1 relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl overflow-hidden min-h-0">
              <div className="absolute inset-3 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
                <UploadCardInner />
              </div>
            </Card>
            <Card className="flex-1 relative flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl overflow-hidden min-h-0">
              <div className="absolute inset-3 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
                <GarmentCardInner hint="Choose from left panel" />
              </div>
            </Card>
          </div>

          <Card className="hidden lg:flex h-full relative items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
              <UploadCardInner />
            </div>
          </Card>

          <Card className="hidden lg:flex h-full relative items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-4 border-2 border-dashed border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center">
              <GarmentCardInner hint="Choose from left panel" />
            </div>
          </Card>

          <div className="h-full flex flex-col gap-2 min-h-0">
            <Card className="flex-1 relative rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden min-h-0">
              <GeneratedInner />
            </Card>
            <GalleryLink />
            <TryOnBtn />
          </div>
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