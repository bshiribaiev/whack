const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, Transaction } = require("@solana/web3.js");
const { Pool } = require("pg");
const BN = require("bn.js");
const { chromium } = require("playwright");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ---- Solana / Anchor setup ----
// NOTE: Run this server from the Anchor workspace root (`shopchain-escrow`) so
// `anchor.workspace.shopchainEscrow` can find Anchor.toml and the IDL.
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.shopchainEscrow;
const connection = provider.connection;
const PROGRAM_ID = program.programId;

// ---- Postgres setup (Vultr) ----
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
});

// Gemini client (for AI listing analysis)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Helper: derive deal PDA
function getDealPda(buyerPk, sellerPk, dealId) {
  const dealIdBuffer = Buffer.alloc(8);
  dealIdBuffer.writeBigUInt64LE(BigInt(dealId));
  
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("deal"), buyerPk.toBuffer(), sellerPk.toBuffer(), dealIdBuffer],
    PROGRAM_ID
  );
  return pda;
}

// Helper: build unsigned tx and return base64
async function buildTx(instruction, payerPubkey) {
  const tx = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = payerPubkey;
  const serialized = tx.serialize({ requireAllSignatures: false });
  return serialized.toString("base64");
}

// ---- Helper: scrape + summarize listing page ----
async function fetchListingSummary(url) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0",
  });

  const page = await context.newPage();

  // Block heavy resources
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "font", "media", "stylesheet"].includes(type)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForLoadState("networkidle");

  // Try to expand "see more" style buttons
  try {
    const buttons = await page.locator("div[role='button']").all();
    for (const btn of buttons) {
      await btn.evaluate((el) => {
        const span = [...el.children].find(
          (c) =>
            c.tagName === "SPAN" &&
            c.innerText.trim().toLowerCase() === "see more"
        );
        if (span) el.click();
      });
    }
  } catch (_) {
    // best-effort only
  }

  // Give the page a moment to settle
  await page.waitForTimeout(800);

  const visibleText = await page.evaluate(() =>
    document.body.innerText.replace(/\s+/g, " ").trim()
  );

  const metaTags = await page.evaluate(() => {
    const metas = Array.from(
      document.querySelectorAll("meta[property^='og:']")
    );
    const out = {};
    metas.forEach((m) => {
      out[m.getAttribute("property")] = m.getAttribute("content") || "";
    });
    return out;
  });

  await browser.close();

  return {
    visible_text: visibleText,
    meta_content: metaTags,
  };
}

// ---- Helper: call Gemini with summary ----
async function analyzeWithGemini(summary) {
  if (!genAI) {
    throw new Error("Gemini API key (API_KEY or GOOGLE_API_KEY) is not set");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemPrompt = `
You are a product safety & scam risk evaluator.
Given product details and user feedback, output a structured JSON with:

1. risk_score (integer 0-100, 0 = very safe, 100 = extremely risky)
2. reasons: short bullet points explaining the risk
3. advice: what the buyer should do
4. suggested_questions: follow-up questions the buyer should ask the seller
5. price: numeric price of the item in USD if possible (infer from the listing text/metadata)
6. title: short title/summary of the item being sold

Evaluate risk strictly on:
- misleading or incomplete descriptions
- suspicious pricing or seller behavior
- inconsistent or fake reviews
- signs of scams

Please note that there will be lots of noise in the data, do your best to filter through it.

Respond with pure JSON only, no extra commentary.
`;

  const contents = systemPrompt + JSON.stringify(summary);
  const result = await model.generateContent(contents);
  const text = result.response.text().trim();

  try {
    // Gemini sometimes wraps JSON in ```json ... ``` fences.
    let cleaned = text;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/```json/gi, "").replace(/```/g, "").trim();
    }
    return JSON.parse(cleaned);
  } catch {
    // Fallback: return raw text so frontend can still show something
    return { raw_response: text };
  }
}

// ---- Express app ----
const app = express();
app.use(cors());
app.use(express.json());

// ---- AI listing analysis (Playwright + Gemini in Node) ----
app.post("/analyze-listing", async (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' in request body" });
  }

  try {
    const summary = await fetchListingSummary(url);
    const aiResult = await analyzeWithGemini(summary);
    console.log("AI result:", JSON.stringify(aiResult, null, 2)); // <-- add this
    return res.json(aiResult);
  } catch (e) {
    console.error("analyze-listing error:", e);
    return res.status(500).json({ error: "Listing analysis failed" });
  }
});

// POST /create-deal
app.post("/create-deal", async (req, res) => {
  try {
    const { buyerPubkey, sellerPubkey, amountSol, dealId, listingUrl, title, riskScore, riskReason, metadata } =
      req.body;
    const buyer = new PublicKey(buyerPubkey);
    const seller = new PublicKey(sellerPubkey);
    const amountLamports = new BN(Math.round(amountSol * 1e9)); // SOL -> lamports
    const dealIdBN = new BN(dealId || Date.now()); // Use timestamp if not provided

    const dealPda = getDealPda(buyer, seller, dealIdBN.toNumber());

    const ix = await program.methods
      .createDeal(amountLamports, dealIdBN)
      .accounts({
        buyer,
        seller,
        deal: dealPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const txBase64 = await buildTx(ix, buyer);

    // DB: record deal (upsert on id)
    await pool.query(
      `INSERT INTO deals (
         id, buyer, seller, amount_lamports, status,
         listing_url, title, risk_score, risk_reason, metadata_json
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE
         SET buyer = EXCLUDED.buyer,
             seller = EXCLUDED.seller,
             amount_lamports = EXCLUDED.amount_lamports,
             status = EXCLUDED.status,
             listing_url = EXCLUDED.listing_url,
             title = EXCLUDED.title,
             risk_score = EXCLUDED.risk_score,
             risk_reason = EXCLUDED.risk_reason,
             metadata_json = EXCLUDED.metadata_json,
             updated_at = now()`,
      [
        dealPda.toBase58(),
        buyer.toBase58(),
        seller.toBase58(),
        amountLamports.toString(),
        "CREATED",
        listingUrl || null,
        title || null,
        typeof riskScore === "number" ? riskScore : null,
        riskReason || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    res.json({
      dealPda: dealPda.toBase58(),
      tx: txBase64,
      status: "CREATED",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /fund-escrow
app.post("/fund-escrow", async (req, res) => {
  try {
    const { buyerPubkey, sellerPubkey, dealId } = req.body;
    const buyer = new PublicKey(buyerPubkey);
    const seller = new PublicKey(sellerPubkey);
    const dealPda = getDealPda(buyer, seller, dealId);

    const ix = await program.methods
      .fundEscrow()
      .accounts({
        buyer,
        seller,
        deal: dealPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const txBase64 = await buildTx(ix, buyer);

    await pool.query(
      `UPDATE deals
       SET status = 'FUNDED', updated_at = now()
       WHERE id = $1`,
      [dealPda.toBase58()]
    );

    res.json({
      dealPda: dealPda.toBase58(),
      tx: txBase64,
      status: "FUNDED",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /release-escrow
app.post("/release-escrow", async (req, res) => {
  try {
    const { buyerPubkey, sellerPubkey, dealId } = req.body;
    const buyer = new PublicKey(buyerPubkey);
    const seller = new PublicKey(sellerPubkey);
    const dealPda = getDealPda(buyer, seller, dealId);

    const ix = await program.methods
      .releaseEscrow()
      .accounts({
        buyer,
        seller,
        deal: dealPda,
      })
      .instruction();

    const txBase64 = await buildTx(ix, buyer);

    await pool.query(
      `UPDATE deals
       SET status = 'RELEASED', updated_at = now()
       WHERE id = $1`,
      [dealPda.toBase58()]
    );

    res.json({
      dealPda: dealPda.toBase58(),
      tx: txBase64,
      status: "RELEASED",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// GET /deal/:id
app.get("/deal/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const { rows } = await pool.query(
      `SELECT * FROM deals WHERE id = $1 LIMIT 1`,
      [id]
    );
    const dbRow = rows[0] || null;

    // Optionally read on-chain deal account
    let onchain = null;
    try {
      const dealPubkey = new PublicKey(id);
      const account = await program.account.deal.fetch(dealPubkey);
      onchain = {
        buyer: account.buyer.toBase58(),
        seller: account.seller.toBase58(),
        amount_lamports: account.amount.toString(),
        is_funded: account.isFunded,
        is_released: account.isReleased,
      };
    } catch (e) {
      // ignore if account missing
    }

    res.json({ db: dbRow, onchain });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`ShopChain backend listening on http://localhost:${port}`);
});