import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Shield, HelpCircle } from "lucide-react";

export default function RiskAnalysis({ data, onBack, onCreateDeal }) {
  const { title, subtitle, price, riskScore, riskLabel, reasons, suggestedQuestions } =
    data;

  const riskColor =
    riskScore < 30 ? "from-emerald-400 to-lime-300" :
    riskScore < 70 ? "from-amber-400 to-orange-400" :
    "from-red-400 to-pink-500";

  return (
    <div className="flex-1 flex items-center justify-center px-4 pb-10 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-slate-900/90 border border-slate-700/80 rounded-[32px] shadow-2xl backdrop-blur-2xl overflow-hidden"
      >
        {/* Top gradient bar / back */}
        <div className="relative">
          <button
            onClick={onBack}
            className="absolute left-4 top-4 z-10 flex items-center gap-2 text-xs text-slate-100/90 bg-black/30 px-3 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="h-14 bg-gradient-to-r from-purple-500 via-sky-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/40">
            <p className="text-sm font-semibold tracking-wide">
              Analyze Listing
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="px-8 py-7 space-y-8">
          {/* Item header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1">{title}</h2>
              <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-400">${price}</p>
              <p className="text-xs text-slate-400 mt-1">Price</p>
            </div>
          </div>

          {/* Risk row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <AlertTriangle size={18} />
              <span>{riskLabel}</span>
            </div>
            <p className="text-lg font-semibold">
              <span>{riskScore}</span>
              <span className="text-slate-400 text-base">/100</span>
            </p>
          </div>

          {/* Risk bar */}
          <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${riskColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${riskScore}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>

          {/* Risk analysis + questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Risk reasons */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-purple-300" />
                <h3 className="text-base font-semibold">Risk Analysis</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-200">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[2px] text-amber-300">⚠️</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested questions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={18} className="text-sky-300" />
                <h3 className="text-base font-semibold">
                  Suggested Questions for Seller
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-200">
                {suggestedQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[2px] text-sky-300">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onCreateDeal}
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-sky-500 hover:from-sky-500 hover:to-purple-500 font-semibold text-sm shadow-lg shadow-purple-500/40 active:scale-[0.98] transition"
          >
            Create Safe Deal (Escrow)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
