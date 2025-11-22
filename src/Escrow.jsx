import { motion } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle2, Loader2, Cpu } from "lucide-react";

function Step({ label, done, loading, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-2 text-xs text-slate-200"
    >
      {done ? (
        <span className="text-emerald-400">
          <CheckCircle2 size={16} />
        </span>
      ) : loading ? (
        <Loader2 size={16} className="text-purple-400 animate-spin" />
      ) : (
        <span className="w-4 h-4 rounded-full border border-slate-600" />
      )}
      <p>{label}</p>
    </motion.div>
  );
}

export default function Escrow({ onBack, onFinish }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 pb-10 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-slate-900/90 border border-slate-700/80 rounded-[32px] shadow-2xl backdrop-blur-2xl p-8"
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to risk
          </button>
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.24em]">
            Step 3 · Escrow creation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.1fr,1fr] gap-10 mb-8">
          {/* Left: circle loader + text */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <motion.div
              className="relative w-32 h-32 rounded-full border-4 border-purple-500/60 border-t-transparent flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              <Lock className="w-10 h-10 text-purple-400" />
            </motion.div>
            <p className="text-xs text-slate-300">
              Connecting to Solana devnet and locking buyer funds…
            </p>
          </div>

          {/* Right: steps */}
          <div className="space-y-3">
            <Step
              label="Wallet verified and signed"
              done
              delay={0.05}
            />
            <Step
              label="Buyer funds moved into escrow program"
              done
              delay={0.1}
            />
            <Step
              label="NFT receipt minted to buyer wallet"
              done
              delay={0.15}
            />
            <Step
              label="Deal record written on-chain"
              loading
              delay={0.2}
            />
          </div>
        </div>

        {/* NFT card */}
        <div className="mb-8 rounded-[24px] bg-slate-950/70 border border-slate-700/80 shadow-xl flex items-center gap-4 px-5 py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/40">
            <Cpu className="w-8 h-8 text-slate-950" />
          </div>
          <div className="text-xs text-slate-200">
            <p className="font-semibold mb-1">NFT Receipt · Deal #1234</p>
            <p className="mb-1">
              Proof that 900 USDC are locked in escrow for this exact listing.
            </p>
            <p className="text-[11px] text-slate-500">
              Token address: <span className="blur-[2px]">9Xy…BkF3</span> ·
              Network: Solana devnet
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-200 hover:bg-slate-800"
          >
            ← Back
          </button>
          <button
            onClick={onFinish}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-sky-500 hover:from-sky-500 hover:to-purple-500 text-xs font-semibold shadow-lg shadow-purple-500/40"
          >
            Continue to deal status →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
