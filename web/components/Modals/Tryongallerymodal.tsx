"use client";

import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTrash, faXmark, faImages } from "@fortawesome/free-solid-svg-icons";
import BASE_URL, { authHeaders } from "@/config/api";
import toast from "react-hot-toast";

type TryOnRecord = {
  _id: string;
  imagePath: string;
  garment: {
    _id: string;
    name: string;
    imagePath: string;
  };
  createdAt: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TryOnGalleryModal({ isOpen, onClose }: Props) {
  const [records, setRecords] = useState<TryOnRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/images/my`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecords(data);
    } catch {
      toast.error("Could not load your try-ons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchRecords();
  }, [isOpen, fetchRecords]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleDeleteConfirmed = async (id: string) => {
    setConfirmId(null);
    setDeletingId(id);
    try {
      const res = await fetch(`${BASE_URL}/api/images/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setRecords((prev) => prev.filter((r) => r._id !== id));
      toast.success("Try-on deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (url: string, id: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `wearify-tryon-${id}.jpg`;
      link.click();
    } catch {
      window.open(url, "_blank");
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .gallery-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .gallery-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
          margin: 8px 0;
        }
        .gallery-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 999px;
        }
        .gallery-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.28);
        }
      `}</style>

      {/* Backdrop — slightly grayish, not pure black */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
        style={{
          backgroundColor: "rgba(118, 118, 119, 0.19)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal Panel — dark gray, not pure black */}
        <div
          className="relative w-full max-w-6xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden"
          style={{
            background: "rgba(17, 19, 92, 0.27)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.70)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-400/50 to-blue-600/90">
                <FontAwesomeIcon icon={faImages} className="text-white text-sm" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg leading-tight">My Try-Ons</h2>
                <p className="text-white/40 text-xs">
                  {records.length} {records.length === 1 ? "result" : "results"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/30 hover:bg-red-500/70 transition duration-200 cursor-pointer"
            >
              <FontAwesomeIcon icon={faXmark} className="text-white text-sm" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto gallery-scroll flex-1 p-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl animate-pulse"
                    style={{ aspectRatio: "2/3", background: "rgba(255,255,255,0.06)" }}
                  />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5">
                  <FontAwesomeIcon icon={faImages} className="text-white/20 text-2xl" />
                </div>
                <p className="text-white/40 text-sm text-center">
                  No try-ons yet. Go generate one!
                </p>
              </div>
            ) : (
              // 2/3 ratio = taller cards, better for full-body fashion images
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {records.map((record) => (
                  <div
                    key={record._id}
                    className="group relative rounded-2xl overflow-hidden"
                    style={{
                      aspectRatio: "2/3",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* Main image */}
                    <img
                      src={record.imagePath}
                      alt="Try-on"
                      className="w-full h-full object-cover"
                    />

                    {/* Top-left: action buttons */}
                    <div className="absolute top-2 left-2 flex gap-1.5  md:group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleDownload(record.imagePath, record._id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-black/35 hover:bg-green-500 transition duration-200 cursor-pointer"
                        title="Download"
                      >
                        <FontAwesomeIcon icon={faDownload} className="text-white text-[10px]" />
                      </button>
                      <button
                        onClick={() => setConfirmId(record._id)}
                        disabled={deletingId === record._id}
                        className="w-7 h-7 rounded-full flex items-center justify-center bg-black/35 hover:bg-red-500 transition duration-200 cursor-pointer disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === record._id ? (
                          <svg className="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <FontAwesomeIcon icon={faTrash} className="text-white text-[10px]" />
                        )}
                      </button>
                    </div>

                    {/* Top-right: garment thumbnail */}
                    {record.garment?.imagePath && (
                      <div className="absolute top-2 right-2">
                        <img
                          src={record.garment.imagePath}
                          alt={record.garment.name}
                          className="w-10 h-14 rounded-lg object-cover"
                          style={{
                            border: "1.5px solid rgba(255,255,255,0.25)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                          }}
                        />
                      </div>
                    )}

                    {/* Bottom: date */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-3 py-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
                    >
                      <p className="text-white/60 text-[10px]">{formatDate(record.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Delete overlay — inside modal panel */}
          {confirmId && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl"
              style={{
                backgroundColor: "rgba(10,10,20,0.6)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              <div
                className="mx-4 w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: "rgba(105, 106, 199, 0.27)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-white font-semibold text-base">Delete Try-On?</h3>
                  <p className="text-white/40 text-sm">
                    This will permanently remove the image from your gallery and storage. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmId(null)}
                    className="px-4 py-2 rounded-full text-sm text-white/60 hover:text-white bg-white/10 hover:bg-white/15 transition duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteConfirmed(confirmId)}
                    className="px-4 py-2 rounded-full text-sm text-white bg-red-500/80 hover:bg-red-500 transition duration-200 cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}