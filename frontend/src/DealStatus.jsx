import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  Package,
  Wallet,
} from "lucide-react";
import DealCard from "./DealCard.jsx";

function StatusRow({ icon: Icon, label, sub, done, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 rounded-2xl bg-black/40 border border-white/10 px-4 py-3"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          done
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-slate-700/50 text-slate-300"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs">
        <p
          className={`font-semibold ${
            done ? "text-emerald-300" : "text-slate-200"
          }`}
        >
          {label}
        </p>
        <p className="text-[11px] text-slate-400">{sub}</p>
      </div>
    </motion.div>
  );
}

function Pill({ color = "green", children }) {
  const base =
    color === "green"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.4)]"
      : "bg-amber-400/20 text-amber-200 border-amber-300/50 shadow-[0_0_18px_rgba(245,158,11,0.4)]";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium border ${base}`}
    >
      {children}
    </span>
  );
}

function LabelWithPill({ label, pill, color }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <Pill color={color}>{pill}</Pill>
    </div>
  );
}

export default function DealStatus({ onBack }) {
  const [stage, setStage] = useState("waiting");

  const handleFund = () => setStage("funded");
  const handleMarkShipped = () => setStage("shipped");
  const handleRelease = () => setStage("released");

  const buyerStatusByStage = {
    waiting: { status: "Waiting to Fund", goods: "—", goodsColor: "amber" },
    funded: { status: "Funded", goods: "Waiting", goodsColor: "amber" },
    shipped: { status: "Funded", goods: "In Transit", goodsColor: "amber" },
    released: { status: "Funded", goods: "Received", goodsColor: "green" },
  }[stage];

  const sellerStatusByStage = {
    waiting: { status: "Waiting", shipping: "—", shippingColor: "amber" },
    funded: {
      status: "Awaiting Delivery",
      shipping: "Not Shipped",
      shippingColor: "amber",
    },
    shipped: {
      status: "Awaiting Delivery",
      shipping: "Shipped",
      shippingColor: "green",
    },
    released: { status: "Paid", shipping: "Delivered", shippingColor: "green" },
  }[stage];

  const escrowLabel =
    stage === "waiting"
      ? "Escrow Empty"
      : stage === "released"
      ? "Escrow Empty"
      : "Locked in Escrow";

  const timeline = {
    fundedActive: stage !== "waiting",
    shippedActive: stage === "shipped" || stage === "released",
    releasedActive: stage === "released",
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 pb-10 pt-6 relative">

      {/* 🔥 ABSOLUTE ESCROW BANNER */}
      <AnimatePresence>
        {(stage === "funded" || stage === "shipped") && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="absolute top-4 right-6 flex items-center gap-3 bg-black/40 border border-emerald-400/30 px-4 py-2 rounded-xl shadow-lg backdrop-blur-md z-50"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-200 font-medium">
              900 USDC currently locked in escrow
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-slate-900/90 border border-slate-700/80 rounded-[32px] shadow-2xl backdrop-blur-2xl p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Start new deal
          </button>
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.24em]">
            Step 4 · Deal status
          </p>
        </div>

        {/* Summary Section */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-1">
              Current state
            </p>
            <p className="text-lg font-semibold text-emerald-300">
              {stage === "released"
                ? "Escrow complete · funds released"
                : "Escrow active · waiting for confirmations"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Demo logic only – in real dApp, each step is synced to Solana program events.
            </p>
          </div>
        </div>

        {/* Deal Card */}
        <DealCard
          stage={stage}
          escrowLabel={escrowLabel}
          timeline={timeline}
          onFund={handleFund}
          onMarkShipped={handleMarkShipped}
          onRelease={handleRelease}
        />

        {/* Buyer / Seller Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Buyer */}
          <div className="rounded-2xl bg-black/35 border border-white/10 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-300 mb-2">
              Buyer
            </p>
            <div className="space-y-2">
              <LabelWithPill
                label="Status:"
                pill={buyerStatusByStage.status}
                color={
                  buyerStatusByStage.status === "Funded" ? "green" : "amber"
                }
              />
              <LabelWithPill
                label="Goods:"
                pill={buyerStatusByStage.goods}
                color={buyerStatusByStage.goodsColor}
              />
            </div>
          </div>

          {/* Seller */}
          <div className="rounded-2xl bg-black/35 border border-white/10 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-violet-300 mb-2">
              Seller
            </p>
            <div className="space-y-2">
              <LabelWithPill
                label="Status:"
                pill={sellerStatusByStage.status}
                color={
                  sellerStatusByStage.status === "Paid" ? "green" : "amber"
                }
              />
              <LabelWithPill
                label="Shipping:"
                pill={sellerStatusByStage.shipping}
                color={sellerStatusByStage.shippingColor}
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 mb-6">
          <StatusRow
            icon={Wallet}
            label="Funds locked in escrow"
            sub="Buyer sent 900 USDC to the ShopChain program."
            done={timeline.fundedActive}
            delay={0.05}
          />
          <StatusRow
            icon={Truck}
            label="Seller shipped the item"
            sub="Seller marked the package as shipped with tracking."
            done={timeline.shippedActive}
            delay={0.12}
          />
          <StatusRow
            icon={Package}
            label="Item delivered"
            sub="Once you confirm, funds can be released."
            done={timeline.releasedActive}
            delay={0.19}
          />
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          Demo only – backend will replace buttons with real Solana transactions.
        </p>
      </motion.div>
    </div>
  );
}
