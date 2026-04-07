"use client";

import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ isOpen, onClose }: Props) {
  const router = useRouter();

  if (!isOpen) return null; // Don't render if modal is closed

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[#0f1729] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        {/* Cross button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition text-2xl font-bold"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Upgrade Required 🚀
        </h2>

        {/* Message */}
        <p className="text-gray-400 text-sm mb-6 text-center">
          You’ve reached your usage limit. Upgrade your plan to continue using
          all features without restrictions.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/plans")}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition cursor-pointer hover:from-[#4287f5] hover:to-[#6a339e]"
          >
            Upgrade Now
          </button>
          
        </div>
      </div>
    </div>
  );
}