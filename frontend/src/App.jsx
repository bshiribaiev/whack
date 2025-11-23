import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";

import RiskAnalysis from "./RiskAnalysis.jsx";
import Escrow from "./Escrow.jsx";
import DealStatus from "./DealStatus.jsx";

function BackgroundFX() {
  return (
    <>
      {/* base gradient */}
      <div className="fixed inset-0 -z-30 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />

      {/* grid */}
      <div className="fixed inset-0 -z-20 opacity-[0.18] pointer-events-none">
        <div className="bg-grid w-full h-full" />
      </div>

      {/* noise */}
      <div className="bg-noise" />

      {/* radial glows */}
      <div className="fixed -z-10 w-[520px] h-[520px] bg-purple-600/40 rounded-full blur-3xl -top-40 -left-10" />
      <div className="fixed -z-10 w-[520px] h-[520px] bg-pink-500/35 rounded-full blur-3xl bottom-[-10rem] right-[-6rem]" />
    </>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [listingUrl, setListingUrl] = useState("");
  const [dealData, setDealData] = useState(null); // Store deal info from Escrow

  const buildMockAnalysis = () => {
    const riskScore = 45;
    return {
      title: "iPhone 15 Pro Max",
      subtitle: "Listed item",
      price: 999,
      riskScore,
      riskLabel: "Medium Risk",
      reasons: [
        "Seller account is less than 3 months old",
        "No verified purchase history",
        "Price is 15% below market average",
      ],
      suggestedQuestions: [
        "Can you provide proof of purchase?",
        "Why is the price below market value?",
        "What is your return policy?",
        "Can you provide additional photos of the item?",
      ],
      url: listingUrl,
    };
  };

  // ---------------- LANDING ----------------
  if (screen === "landing") {
    return (
      <div className="relative min-h-screen flex flex-col text-white">
        <BackgroundFX />

        {/* Top nav */}
        <header className="relative z-10 flex items-center justify-between px-10 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ShopChain</h1>
              <p className="text-xs text-slate-400">
                Safety layer for buying risky stuff online
              </p>
            </div>
          </div>

          <WalletMultiButton className="!px-4 !py-2 !rounded-xl !bg-purple-600 hover:!bg-purple-700 text-sm shadow-lg shadow-purple-500/40" />
        </header>

        {/* Hero */}
        <main className="relative z-10 flex-1 flex items-start justify-center px-4 pb-12 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-2xl shadow-black/70 px-10 py-9 md:px-12 md:py-10"
          >
            {/* Hero copy */}
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 mb-3">
                  Safer online deals
                </p>
                <h2 className="text-4xl md:text-[40px] font-semibold tracking-tight leading-tight mb-3">
                  Paste a risky listing.
                  <br />
                  Lock your money in escrow.
                </h2>
                <p className="text-sm md:text-[15px] text-slate-300 max-w-xl">
                  ShopChain scans marketplace links for scam signals and, if you
                  still want to buy, locks your funds into a Solana escrow with
                  an NFT receipt for the deal.
                </p>
              </div>
              <Sparkles className="hidden md:block w-9 h-9 text-pink-400 mt-1" />
            </div>

            {/* Input + CTA */}
            <div className="space-y-4 mb-7">
              <input
                value={listingUrl}
                onChange={(e) => setListingUrl(e.target.value)}
                placeholder="Paste eBay / Facebook Marketplace / Discord listing URL…"
                className="w-full px-5 py-4 rounded-[18px] bg-black/60 border border-slate-800 focus:border-purple-500 outline-none text-sm shadow-inner shadow-black/40"
              />
              <button
                onClick={() => {
                  if (!listingUrl.trim()) {
                    alert("Paste a listing URL first.");
                    return;
                  }
                  setScreen("risk");
                }}
                className="w-full py-3.5 rounded-[18px] bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 hover:from-sky-500 hover:via-pink-500 hover:to-purple-500 font-semibold text-sm shadow-lg shadow-purple-500/50 active:scale-[0.98] transition"
              >
                Scan listing for scam risk →
              </button>
            </div>

            {/* Feature row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-black/40 border border-slate-800 px-5 py-4 flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-200 text-sm">
                  🔍
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-100 mb-1">
                    AI Listing Analysis
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Checks tone, pricing, and seller metadata for risk signals.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-black/40 border border-slate-800 px-5 py-4 flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-amber-300 text-sm">
                  🔒
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-100 mb-1">
                    Solana Escrow
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Funds sit in a smart contract until you confirm delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Demo note */}
            <p className="text-[11px] text-slate-500 text-center">
              Demo mode · Uses Solana devnet · All data is mocked for UI only
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  // ---------------- RISK ANALYSIS ----------------
  if (screen === "risk") {
    return (
      <div className="relative min-h-screen flex flex-col text-white">
        <BackgroundFX />
        <RiskAnalysis
          data={buildMockAnalysis()}
          onBack={() => setScreen("landing")}
          onCreateDeal={() => setScreen("deal")}
        />
      </div>
    );
  }

  // ---------------- ESCROW ----------------
  if (screen === "deal") {
    const analysis = buildMockAnalysis(); // reuse your existing function
  
    return (
      <div className="relative min-h-screen flex flex-col text-white">
        <BackgroundFX />
        <Escrow
          onBack={() => setScreen("risk")}
          onFinish={(data) => {
            setDealData(data);
            setScreen("status");
          }}
          analysis={analysis}
        />
      </div>
    );
  }
  // ---------------- DEAL STATUS ----------------
  if (screen === "status") {
    return (
      <div className="relative min-h-screen flex flex-col text-white">
        <BackgroundFX />
        <DealStatus 
          onBack={() => setScreen("landing")} 
          dealData={dealData}
        />
      </div>
    );
  }

  return null;
}
