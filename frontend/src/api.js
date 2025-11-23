const API_URL = import.meta.env.VITE_BACKEND_URL;

console.log("API_URL configured:", API_URL);

export async function createDealApi({ buyerPubkey, sellerPubkey, amountSol, dealId, analysis }) {
  console.log("Calling createDealApi:", { buyerPubkey, sellerPubkey, amountSol, dealId });
  
  if (!API_URL) {
    throw new Error("VITE_BACKEND_URL is not set in your frontend .env");
  }
  
  const res = await fetch(`${API_URL}/create-deal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerPubkey,
      sellerPubkey,
      amountSol,
      dealId,
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

export async function fundEscrowApi({ buyerPubkey, sellerPubkey, dealId }) {
  console.log("Calling fundEscrowApi:", { buyerPubkey, sellerPubkey, dealId });
  
  if (!API_URL) {
    throw new Error("VITE_BACKEND_URL is not set in your frontend .env");
  }
  const res = await fetch(`${API_URL}/fund-escrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerPubkey,
      sellerPubkey,
      dealId,
    }),
  });
  if (!res.ok) {
    let msg = `fund-escrow failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function releaseEscrowApi({ buyerPubkey, sellerPubkey, dealId }) {
  if (!API_URL) {
    throw new Error("VITE_BACKEND_URL is not set in your frontend .env");
  }
  const res = await fetch(`${API_URL}/release-escrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerPubkey,
      sellerPubkey,
      dealId,
    }),
  });
  if (!res.ok) {
    let msg = `release-escrow failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}