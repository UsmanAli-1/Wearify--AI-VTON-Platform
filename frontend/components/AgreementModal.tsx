"use client";

import BASE_URL from "@/config/api";
import toast from "react-hot-toast";

type Props = {
  onAgree: () => void;
  onDecline: () => void;
};

export default function AgreementModal({ onAgree, onDecline }: Props) {
  const handleAgree = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/agree`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        onAgree();
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[#0f1729] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4 flex justify-center">
          Your Privacy Matters 🛡️
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Before using our Virtual Try-On feature, please read and agree to the
          following:
        </p>

        {/* Points */}
        <ul className="space-y-3 mb-8">
          {[
            "Your photos are used only for try-on generation",
            "We never share your photos with third parties",
            "Your data is stored securely on our servers",
            "You can delete your generated images anytime",
            "Only you can see your generated results",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
              <span className="text-green-400 mt-0.5">✔</span>
              {item}
            </li>
          ))}
        </ul>

        {/* Consent text */}
        <p className="text-gray-500 text-xs mb-6 text-center">
          By clicking{" "}
          <span className="text-white font-semibold">"I Agree"</span>, you give
          Wearify permission to process your uploaded photos for virtual try-on
          purposes only.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition text-sm font-medium cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={handleAgree}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition cursor-pointer"
          >
            I Agree
          </button>
        </div>

      </div>
    </div>
  );
}