use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

declare_id!("EpCUmJZJBad5utkWnhA7UgzQEVcPzvk738MxyP9b2NSR");

#[program]
pub mod shopchain_escrow {
    use super::*;

    /// Create a new deal and its escrow account 
    pub fn create_deal(ctx: Context<CreateDeal>, amount: u64, deal_id: u64) -> Result<()> {
        let deal = &mut ctx.accounts.deal;

        deal.buyer = ctx.accounts.buyer.key();
        deal.seller = ctx.accounts.seller.key();
        deal.amount = amount;
        deal.deal_id = deal_id;
        deal.is_funded = false;
        deal.is_released = false;
        deal.bump = ctx.bumps.deal;

        Ok(())
    }

    /// Buyer funds the escrow: move SOL from buyer -> deal PDA
    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        // read-only borrow for checks and amount
        let deal = &ctx.accounts.deal;

        require_keys_eq!(
            deal.buyer,
            ctx.accounts.buyer.key(),
            EscrowError::UnauthorizedBuyer
        );
        require!(!deal.is_funded, EscrowError::AlreadyFunded);

        let amount = deal.amount;

        // System program transfer from buyer -> deal PDA
        let ix = system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.deal.key(),
            amount,
        );

        let accounts = &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.deal.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ];

        invoke(&ix, accounts)?;

        // now mutate the account directly
        ctx.accounts.deal.is_funded = true;
        Ok(())
    }

    /// Release funds from escrow PDA -> seller
    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        // read-only borrow for checks and amount
        let deal = &ctx.accounts.deal;

        require!(deal.is_funded, EscrowError::NotFunded);
        require!(!deal.is_released, EscrowError::AlreadyReleased);
        require_keys_eq!(
            deal.buyer,
            ctx.accounts.buyer.key(),
            EscrowError::UnauthorizedBuyer
        );

        let deal_info = ctx.accounts.deal.to_account_info();
        let seller_info = ctx.accounts.seller.to_account_info();

        let amount = deal.amount;

        // Move lamports from deal PDA to seller (leave rent in PDA)
        let rent_exempt = Rent::get()?.minimum_balance(deal_info.data_len());
        let available = deal_info.lamports().saturating_sub(rent_exempt);
        require!(available >= amount, EscrowError::InsufficientEscrowBalance);

        **deal_info.try_borrow_mut_lamports()? -= amount;
        **seller_info.try_borrow_mut_lamports()? += amount;

        ctx.accounts.deal.is_released = true;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, deal_id: u64)]
pub struct CreateDeal<'info> {

    /// Payer + buyer (for now, same person).
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Seller wallet (doesn't need to sign to create the deal)
    pub seller: SystemAccount<'info>,

    /// PDA that stores deal metadata and holds escrowed SOL.
    #[account(
        init,
        payer = buyer,
        space = 8 + Deal::LEN,
        seeds = [b"deal", buyer.key().as_ref(), seller.key().as_ref(), &deal_id.to_le_bytes()],
        bump
    )]
    pub deal: Account<'info, Deal>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    /// Buyer funding the escrow.
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Same seller as in the deal seeds (so PDA matches).
    pub seller: SystemAccount<'info>,

    /// Existing deal PDA
    #[account(
        mut,
        seeds = [b"deal", buyer.key().as_ref(), seller.key().as_ref(), &deal.deal_id.to_le_bytes()],
        bump = deal.bump,
    )]
    pub deal: Account<'info, Deal>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {

    /// Buyer authorizes release (happy path)
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Seller receives funds
    #[account(mut)]
    pub seller: SystemAccount<'info>,

    /// Existing deal PDA
    #[account(
        mut,
        seeds = [b"deal", buyer.key().as_ref(), seller.key().as_ref(), &deal.deal_id.to_le_bytes()],
        bump = deal.bump,
    )]
    pub deal: Account<'info, Deal>,
}

#[account]
pub struct Deal {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub deal_id: u64,
    pub is_funded: bool,
    pub is_released: bool,
    pub bump: u8,
}

impl Deal {
    pub const LEN: usize = 32 + 32 + 8 + 8 + 1 + 1 + 1; // Added 8 bytes for deal_id
}

#[error_code]
pub enum EscrowError {
    #[msg("Only the buyer can perform this action.")]
    UnauthorizedBuyer,
    #[msg("Escrow already funded.")]
    AlreadyFunded,
    #[msg("Escrow is not funded.")]
    NotFunded,
    #[msg("Escrow already released.")]
    AlreadyReleased,
    #[msg("Not enough SOL in escrow to release.")]
    InsufficientEscrowBalance,
}