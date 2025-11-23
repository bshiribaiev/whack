import { motion } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle2, Loader2, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

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

export default function Escrow({ onBack, onFinish, analysis }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txSig, setTxSig] = useState(null);

  const handleCreateDeal = async () => {
    if (!connected || !publicKey) {
      setError("Connect your wallet first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // TODO: replace with real seller wallet from your flow
      const sellerPubkey = "A5YY4GEmpgCn4D77H9ALwXfMa26hq5Q7Yo4uQ3zmSNPx";

      const { tx, dealPda } = await createDealApi({
        buyerPubkey: publicKey.toBase58(),
        sellerPubkey,
        amountSol: 0.1,   // or derive from analysis/price
        analysis,
      });

      const transaction = Transaction.from(Buffer.from(tx, "base64"));
      const sig = await sendTransaction(transaction, connection);
      setTxSig(sig);
      console.log("Create-deal tx:", sig, "dealPda:", dealPda);

      onFinish(); // move to DealStatus screen
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 pb-10 pt-6">
      {/* keep your existing animated UI... */}

      {/* at bottom, change the primary button: */}
      <div className="flex justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-200 hover:bg-slate-800"
        >
          ← Back
        </button>
        <button
          onClick={handleCreateDeal}
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-sky-500 hover:from-sky-500 hover:to-purple-500 text-xs font-semibold shadow-lg shadow-purple-500/40 disabled:opacity-60"
        >
          {loading ? "Locking funds…" : "Continue to deal status →"}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-400 text-right w-full">
          {error}
        </p>
      )}
      {txSig && (
        <p className="mt-2 text-[10px] text-slate-400 text-right w-full">
          Tx: {txSig}
        </p>
      )}
    </div>
  );
}
