import { DollarSign } from "lucide-react";

export default function AnimatedCoin({ size = "md" }) {
  const base =
    size === "md"
      ? "w-10 h-10 text-[11px]"
      : "w-7 h-7 text-[10px] shadow-[0_0_12px_rgba(248,250,252,0.7)]";

  return (
    <div
      className={`${base} rounded-full bg-gradient-to-br from-cyan-300 via-sky-300 to-amber-200 shadow-[0_0_22px_rgba(250,240,200,0.9)] relative flex items-center justify-center text-slate-900`}
    >
      <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-white/75 blur-[1px] opacity-90" />
      <div className="absolute inset-[2px] rounded-full border border-white/30" />
      <DollarSign className="w-4 h-4" />
    </div>
  );
}
