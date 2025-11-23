const anchor = require("@coral-xyz/anchor");
const { SystemProgram, PublicKey, LAMPORTS_PER_SOL } = anchor.web3;

describe("shopchain-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.shopchainEscrow;
  const buyer = provider.wallet;            // your local wallet
  const seller = anchor.web3.Keypair.generate(); // random seller for the test

  it("creates, funds, and releases a deal", async () => {
    const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL in lamports

    // Derive the same PDA as in the program (seeds: "deal", buyer, seller)
    const [dealPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("deal"), buyer.publicKey.toBuffer(), seller.publicKey.toBuffer()],
      program.programId
    );

    // 1) create_deal
    await program.methods
      .createDeal(amount)
      .accounts({
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        deal: dealPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 2) fund_escrow (buyer sends SOL into the deal PDA)
    await program.methods
      .fundEscrow()
      .accounts({
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        deal: dealPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 3) release_escrow (buyer releases funds to seller)
    await program.methods
      .releaseEscrow()
      .accounts({
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        deal: dealPda,
      })
      .rpc();
  });
});