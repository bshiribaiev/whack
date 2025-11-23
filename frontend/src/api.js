const API_URL = import.meta.env.VITE_BACKEND_URL;

export async function createDealApi({ buyerPubkey, sellerPubkey, amountSol, analysis }) {
  const res = await fetch(`${API_URL}/create-deal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerPubkey,
      sellerPubkey,
      amountSol,
      listingUrl: analysis?.url,
      title: analysis?.title,
      riskScore: analysis?.riskScore,
      riskReason: (analysis?.reasons || []).join(" | "),
      metadata: analysis,
    }),
  });

  if (!res.ok) {
    let msg = `create-deal failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  return res.json(); // { dealPda, tx, status }
}