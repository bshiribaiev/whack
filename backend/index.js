const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram, Transaction } = require("@solana/web3.js");
const { Pool } = require("pg");
const BN = require("bn.js");

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

// ---- Express app ----
const app = express();
app.use(cors());
app.use(express.json());

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