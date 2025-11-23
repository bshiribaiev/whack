// src/DealCard.jsx
import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import confetti from "canvas-confetti";

export default function DealCard({
  stage,          // "waiting" | "funded" | "shipped" | "released"
  escrowLabel,
  timeline,
  onFund,
  onMarkShipped,
  onRelease,
}) {
  const cardRef = useRef(null);
  const buyerRef = useRef(null);
  const escrowRef = useRef(null);
  const sellerRef = useRef(null);

  // coinAnim: null or { key, xs, ys, onDone }
  const [coinAnim, setCoinAnim] = useState(null);

  const startCoinFlight = useCallback((fromEl, toEl, onDone) => {
    if (!fromEl || !toEl || !cardRef.current) {
      onDone && onDone();
      return;
    }

    const cardRect = cardRef.current.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    // Positions relative to center of the card
    const start = {
      x:
        fromRect.left +
        fromRect.width / 2 -
        (cardRect.left + cardRect.width / 2),
      y:
        fromRect.top +
        fromRect.height / 2 -
        (cardRect.top + cardRect.height / 2),
    };
    const end = {
      x:
        toRect.left +
        toRect.width / 2 -
        (cardRect.left + cardRect.width / 2),
      y:
        toRect.top +
        toRect.height / 2 -
        (cardRect.top + cardRect.height / 2),
    };

    // Midpoint lifted upwards for a nice curve
    const mid = {
      x: (start.x + end.x) / 2,
      y: Math.min(start.y, end.y) - 80,
    };

    setCoinAnim({
      key: Date.now(),
      xs: [start.x, mid.x, end.x],
      ys: [start.y, mid.y, end.y],
      onDone,
    });
  }, []);

  const handleFundClick = () => {
    if (stage !== "waiting") return;
    startCoinFlight(buyerRef.current, escrowRef.current, () => {
      onFund && onFund();
    });
  };

  const handleMarkShippedClick = () => {
    if (stage !== "funded") return;
    onMarkShipped && onMarkShipped();
  };

  const handleReleaseClick = () => {
    if (stage !== "shipped") return;
    startCoinFlight(escrowRef.current, sellerRef.current, () => {
      confetti({
        particleCount: 90,
        spread: 65,
        origin: { y: 0.65 },
        colors: ["#a855f7", "#60a5fa", "#34d399"],
      });
      onRelease && onRelease();
    });
  };

  // Primary button text + click behavior
  let primaryLabel = "Fund escrow";
  let primaryOnClick = handleFundClick;
  let primaryDisabled = false;

  if (stage === "funded") {
    primaryLabel = "Mark shipped";
    primaryOnClick = handleMarkShippedClick;
  } else if (stage === "shipped") {
    primaryLabel = "Release funds";
    primaryOnClick = handleReleaseClick;
  } else if (stage === "released") {
    primaryLabel = "Completed";
    primaryOnClick = undefined;
    primaryDisabled = true;
  }

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-5xl bg-black/30 border border-white/10 rounded-3xl p-10 mb-8 shadow-xl overflow-hidden mx-auto"
    >
      {/* subtle background glows */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
        <div className="absolute w-64 h-64 bg-purple-500/25 rounded-full blur-3xl -top-16 -left-20" />
        <div className="absolute w-64 h-64 bg-sky-400/25 rounded-full blur-3xl -bottom-20 -right-16" />
      </div>

      {/* header */}
      <div className="relative flex items-center justify-between mb-6">
        <p className="text-[11px] tracking-[0.25em] text-slate-400 uppercase">
          Deal card
        </p>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-100">$999</p>
          <p className="text-[11px] text-slate-400">{escrowLabel}</p>
        </div>
      </div>

      {/* main row */}
      <div className="relative flex items-center justify-between">
        {/* Buyer */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-sky-400/10 blur-2xl" />
            <div
              ref={buyerRef}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center font-bold shadow-lg shadow-sky-500/50"
            >
              B
            </div>
          </div>
          <p className="text-xs text-slate-200 mt-1">Buyer</p>
          <p className="text-[10px] text-slate-500">5Gw8…3d9K</p>
          <div className="mt-4 space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
                {stage === "waiting" ? "Waiting to fund" : "Funded"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Goods:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-200">
                {stage === "released" ? "Received" : stage === "shipped" ? "In transit" : "Waiting"}
              </span>
            </div>
          </div>
        </div>

        {/* Escrow */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-8 rounded-[40px] bg-amber-300/10 blur-3xl" />
            <div
              ref={escrowRef}
              className="relative w-36 h-36 rounded-[32px] bg-slate-950/90 flex items-center justify-center shadow-2xl border border-yellow-100/10"
            >
              <Lock className="w-11 h-11 text-slate-100" />
            </div>
          </div>
          <p className="text-[11px] tracking-[0.25em] text-slate-400">
            ESCROW
          </p>
        </div>

        {/* Seller */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-[26px] bg-fuchsia-400/16 blur-3xl" />
            <div
              ref={sellerRef}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center font-bold shadow-lg shadow-fuchsia-500/60"
            >
              S
            </div>
          </div>
          <p className="text-xs text-slate-200 mt-1">Seller</p>
          <p className="text-[10px] text-slate-500">7hN2…8mP1</p>
          <div className="mt-4 space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
                {stage === "released" ? "Paid" : "Waiting"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Shipping:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-200">
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

      {/* Coin flight (ONLY during animation) */}
      {coinAnim && (
        <motion.div
          key={coinAnim.key}
          className="pointer-events-none absolute z-20 top-1/2 left-1/2"
          initial={{
            opacity: 0,
            x: coinAnim.xs[0],
            y: coinAnim.ys[0],
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: coinAnim.xs,
            y: coinAnim.ys,
          }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          onAnimationComplete={() => {
            coinAnim.onDone && coinAnim.onDone();
            setCoinAnim(null);
          }}
        >
          <div className="relative w-10 h-10 rounded-full bg-sky-400 shadow-[0_0_22px_rgba(96,165,250,0.8)] flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-white/30 blur-md" />
            <div className="relative z-10 text-sky-950 font-bold text-lg">
              $
            </div>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="mt-10">
        <div className="flex justify-between text-[11px] text-slate-400 mb-1 px-1">
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
            className="h-full w-full bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX:
                stage === "waiting"
                  ? 0
                  : stage === "funded"
                  ? 0.33
                  : stage === "shipped"
                  ? 0.66
                  : 1,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="relative flex items-center gap-3 mt-8">
        <button
          onClick={primaryOnClick}
          disabled={primaryDisabled}
          className={`px-7 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition ${
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
          className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm shadow-inner hover:bg-slate-700/80"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
