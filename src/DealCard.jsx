// src/DealCard.jsx
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import confetti from "canvas-confetti";

export default function DealCard({
  stage,
  escrowLabel,
  timeline,
  onFund,
  onMarkShipped,
  onRelease,
}) {
  const handleFundClick = () => {
    if (stage !== "waiting") return;
    onFund();
  };

  const handleMarkShippedClick = () => {
    if (stage !== "funded") return;
    onMarkShipped();
  };

  const handleReleaseClick = () => {
    if (stage !== "shipped") return;
    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.65 },
      colors: ["#a855f7", "#60a5fa", "#34d399"],
    });
    onRelease();
  };

  let primaryLabel = "Fund escrow";
  if (stage === "funded") primaryLabel = "Mark shipped";
  if (stage === "shipped") primaryLabel = "Release funds";
  if (stage === "released") primaryLabel = "Completed";

  const primaryDisabled = stage === "released";

  const progressWidth =
    stage === "waiting"
      ? "0%"
      : stage === "funded"
      ? "33%"
      : stage === "shipped"
      ? "66%"
      : "100%";

  const escrowGlow =
    stage === "funded" || stage === "shipped" || stage === "released"
      ? "shadow-[0_0_40px_rgba(250,250,180,0.55)]"
      : "shadow-[0_0_26px_rgba(148,163,184,0.45)]";

  const sellerGlow =
    stage === "released"
      ? "shadow-[0_0_34px_rgba(167,139,250,0.7)]"
      : "shadow-[0_0_22px_rgba(129,140,248,0.45)]";

  const buyerGlow = "shadow-[0_0_26px_rgba(56,189,248,0.7)]";

  return (
    <div className="relative w-full bg-[rgba(3,7,18,0.85)] border border-white/10 rounded-3xl p-10 mb-8 shadow-[0_0_40px_rgba(0,0,0,0.7)] overflow-hidden">
      {/* subtle background glows – fixed to card, not avatars */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
        <div className="absolute w-64 h-64 bg-purple-500/25 rounded-full blur-3xl -top-20 left-1/4" />
        <div className="absolute w-64 h-64 bg-sky-400/25 rounded-full blur-3xl -bottom-24 right-1/4" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-8">
        <p className="text-[11px] tracking-[0.25em] text-slate-400 uppercase">
          Deal card
        </p>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-100">$999</p>
          <p className="text-[11px] text-slate-400">{escrowLabel}</p>
        </div>
      </div>

      {/* Main row: Buyer – Escrow – Seller */}
      <div className="relative flex items-center justify-between mb-10">
        {/* Buyer */}
        <div className="flex flex-col items-center gap-3 min-w-[120px]">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center font-bold text-lg text-white ${buyerGlow}`}
          >
            B
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-100">Buyer</p>
            <p className="text-[10px] text-slate-500">5Gw8…3d9K</p>
          </div>
          <div className="mt-1 space-y-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[10px]">
                {stage === "waiting" ? "Waiting to fund" : "Funded"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Goods:</span>
              <span className="px-3 py-1 rounded-full border text-[10px] border-amber-400/35 bg-amber-500/10 text-amber-200">
                {stage === "released"
                  ? "Received"
                  : stage === "shipped"
                  ? "In transit"
                  : "Waiting"}
              </span>
            </div>
          </div>
        </div>

        {/* Escrow lock */}
        <div className="flex flex-col items-center gap-3 min-w-[180px]">
          <div
            className={`relative w-28 h-28 rounded-3xl bg-slate-950/90 flex items-center justify-center border border-slate-700/80 ${escrowGlow} transition-all`}
          >
            <Lock className="w-12 h-12 text-slate-100" />
          </div>
          <p className="text-[10px] tracking-[0.25em] text-slate-400">
            ESCROW
          </p>
        </div>

        {/* Seller */}
        <div className="flex flex-col items-center gap-3 min-w-[140px]">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center font-bold text-lg text-white ${sellerGlow}`}
          >
            S
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-100">Seller</p>
            <p className="text-[10px] text-slate-500">7hN2…8mP1</p>
          </div>
          <div className="mt-1 space-y-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[10px]">
                {stage === "released" ? "Paid" : "Awaiting payment"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Shipping:</span>
              <span className="px-3 py-1 rounded-full border text-[10px] border-emerald-400/35 bg-emerald-500/10 text-emerald-200">
                {stage === "released"
                  ? "Delivered"
                  : stage === "shipped"
                  ? "Shipped"
                  : "Not shipped"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="flex justify-between text-[11px] text-slate-400 mb-2 px-1">
          <span className={timeline.fundedActive ? "text-emerald-300" : ""}>
            Funded
          </span>
          <span className={timeline.shippedActive ? "text-emerald-300" : ""}>
            Shipped
          </span>
          <span className={timeline.releasedActive ? "text-emerald-300" : ""}>
            Released
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: progressWidth }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="relative flex items-center gap-3 mt-8">
        <button
          onClick={
            stage === "waiting"
              ? handleFundClick
              : stage === "funded"
              ? handleMarkShippedClick
              : stage === "shipped"
              ? handleReleaseClick
              : undefined
          }
          disabled={primaryDisabled}
          className={`px-8 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition ${
            stage === "waiting"
              ? "bg-sky-500 text-white hover:bg-sky-400"
              : stage === "funded"
              ? "bg-indigo-500 text-white hover:bg-indigo-400"
              : stage === "shipped"
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {primaryLabel}
        </button>

        <button
          onClick={() => window.location.reload()}
          className="px-7 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm shadow-inner hover:bg-slate-700/80 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
