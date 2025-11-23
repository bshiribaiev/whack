import { motion } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle2, Loader2, Cpu } from "lucide-react";
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { createDealApi } from "./api.js";

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
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txSig, setTxSig] = useState(null);
  const [sellerAddress, setSellerAddress] = useState("");
  const [amount, setAmount] = useState("0.1"); // Amount in SOL

  // Auto-open wallet modal when entering the Escrow page if not connected
  useEffect(() => {
    if (!connected && !publicKey) {
      // Open the wallet selection modal
      setTimeout(() => {
        setVisible(true);
      }, 100);
    }
  }, []); // Run once on mount

  const handleCreateDeal = async () => {
    setError(null);
  
    // Safety check: if user closed the popup without connecting
    if (!publicKey) {
      setError("Please connect your wallet to continue.");
      return;
    }
  
    // Require seller address
    if (!sellerAddress.trim()) {
      setError("Enter a seller wallet address.");
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    const sellerPubkey = sellerAddress.trim();
    const dealId = Date.now(); // Use timestamp as unique deal ID

    setLoading(true);
    try {
      const { tx, dealPda } = await createDealApi({
        buyerPubkey: publicKey.toBase58(),
        sellerPubkey,
        amountSol: amountNum,
        dealId,
        analysis,
      });
  
      const transaction = Transaction.from(Buffer.from(tx, "base64"));
      
      console.log("Sending transaction...", {
        buyer: publicKey.toBase58(),
        seller: sellerPubkey,
        dealPda,
      });
      
      const sig = await sendTransaction(transaction, connection);
      setTxSig(sig);
      console.log("✅ Create-deal tx successful:", sig, "dealPda:", dealPda);
  
      // Pass deal data to DealStatus screen
      onFinish({
        dealPda,
        txSig: sig,
        buyer: publicKey.toBase58(),
        seller: sellerPubkey,
        amountSol: amountNum,
        dealId,
        analysis,
      });
    } catch (e) {
      console.error("❌ Transaction failed:", e);
      console.error("Full error:", JSON.stringify(e, null, 2));
      
      if (e.message.includes("User rejected")) {
        setError("Transaction cancelled by user");
      } else if (e.message.includes("insufficient")) {
        setError("Insufficient SOL balance. Get devnet SOL from faucet.solana.com");
      } else {
        setError(e.message || "Transaction failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex items-center gap-3">
            <WalletMultiButton className="!px-3 !py-1.5 !rounded-xl !bg-purple-600 hover:!bg-purple-700 !text-xs shadow-lg shadow-purple-500/40" />
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.24em]">
              Step 3 · Escrow creation
            </p>
          </div>
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
              {loading
                ? "Connecting to Solana devnet and locking buyer funds…"
                : txSig
                ? "Funds locked and deal created. Continue to status view."
                : "Ready to lock buyer funds into escrow."}
            </p>
          </div>

          {/* Right: steps */}
          <div className="space-y-3">
            <Step
              label="Wallet verified and signed"
              done={!!publicKey}
              delay={0.05}
            />
            <Step
              label="Buyer funds moved into escrow program"
              done={!!txSig}
              delay={0.1}
            />
            <Step
              label="NFT receipt minted to buyer wallet"
              done={false}
              delay={0.15}
            />
            <Step
              label="Deal record written on-chain"
              loading={loading && !txSig}
              delay={0.2}
            />
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1">
            Amount (SOL)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            className="w-full px-4 py-2 rounded-xl bg-black/60 border border-slate-700 focus:border-purple-500 outline-none text-xs text-slate-100"
          />
        </div>

        {/* Seller address input */}
        <div className="mb-6">
          <label className="block text-xs text-slate-400 mb-1">
            Seller wallet address (Solana)
          </label>
          <input
            value={sellerAddress}
            onChange={(e) => setSellerAddress(e.target.value)}
            placeholder="Paste seller's Solana address"
            className="w-full px-4 py-2 rounded-xl bg-black/60 border border-slate-700 focus:border-purple-500 outline-none text-xs text-slate-100"
          />
        </div>

        {/* Buttons + errors */}
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
          <p className="mt-4 text-xs text-red-400 text-right w-full">{error}</p>
        )}
        {txSig && (
          <p className="mt-2 text-[10px] text-slate-400 text-right w-full">
            Tx: {txSig}
          </p>
        )}
      </motion.div>
    </div>
  );
}
