import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../index";
import { create_image } from "../tools/create_image";
import { fetchPrice } from "../tools/fetch_price";
import { BN } from "@coral-xyz/anchor";
import { FEE_TIERS } from "../tools";
import { toJSON } from "../utils/toJSON";

export class SolanaBalanceTool extends Tool {
  name = "solana_balance";
  description = `Get the balance of a Solana wallet 
  Inputs:
  no inputs required`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const tokenAddress = input ? new PublicKey(input) : undefined;
      const balance = await this.solanaKit.getBalance(tokenAddress);

      return balance!=undefined ? balance.toString() : "Not found.";
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaTransferTool extends Tool {
  name = "solana_transfer";
  description = `Transfer tokens or SOL to another address ( also called as wallet address ).

  Inputs ( input is a JSON string ):
  to: string, eg "8x2dR8Mpzuz2YqyZyZjUbYWKSWesBo5jMx2Q9Y86udVk" (required)
  amount: number, eg 1 (required)
  mint?: string, eg "So11111111111111111111111111111111111111112" or "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa" (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const recipient = new PublicKey(parsedInput.to);
      const mintAddress = parsedInput.mint
        ? new PublicKey(parsedInput.mint)
        : undefined;

      const tx = await this.solanaKit.transfer(
        recipient,
        parsedInput.amount,
        mintAddress
      );
      return "Transfer completed successfully of " + parsedInput.amount + " to " + parsedInput.to + " with tx " + tx;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaDeployTokenTool extends Tool {
  name = "solana_deploy_token";
  description = `Deploy a new token on Solana blockchain.

  Inputs (input is a JSON string):
  name: string, eg "My Token" (required)
  uri: string, eg "https://example.com/token.json" (required) 
  symbol: string, eg "MTK" (required)
  decimals?: number, eg 9 (optional, defaults to 9)
  initialSupply?: number, eg 1000000 (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.deployToken(
        parsedInput.name,
        parsedInput.uri,
        parsedInput.symbol,
        parsedInput.decimals,
        parsedInput.initialSupply
      );
      return "Token deployed successfully with mint address " + result.mint+ " and decimals " + (parsedInput.decimals || 9);
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaDeployCollectionTool extends Tool {
  name = "solana_deploy_collection";
  description = `Deploy a new NFT collection on Solana blockchain.

  Inputs (input is a JSON string):
  name: string, eg "My Collection" (required)
  uri: string, eg "https://example.com/collection.json" (required)
  royaltyBasisPoints?: number, eg 500 for 5% (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.deployCollection(parsedInput);
      return "Collection deployed successfully with mint address " + result.collectionAddress+ " and name " + parsedInput.name;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaMintNFTTool extends Tool {
  name = "solana_mint_nft";
  description = `Mint a new NFT in a collection on Solana blockchain.

    Inputs (input is a JSON string):
    collectionMint: string, eg "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w" (required) - The address of the collection to mint into
    name: string, eg "My NFT" (required)
    uri: string, eg "https://example.com/nft.json" (required)
    recipient?: string, eg "9aUn5swQzUTRanaaTwmszxiv89cvFwUCjEBv1vZCoT1u" (optional) - The wallet to receive the NFT, defaults to agent's wallet which is ${this.solanaKit.wallet_address.toString()}`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const result = await this.solanaKit.mintNFT(
        new PublicKey(parsedInput.collectionMint),
        {
          name: parsedInput.name,
          uri: parsedInput.uri,
        },
        parsedInput.recipient
          ? new PublicKey(parsedInput.recipient)
          : this.solanaKit.wallet_address
      );
      return "NFT minted successfully with mint address " + result.mint.toString()+ " and name " + parsedInput.name+ " and symbol " + parsedInput.symbol+ " and uri " + parsedInput.uri+ " and recipient " + parsedInput.recipient;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaTradeTool extends Tool {
  name = "solana_trade";
  description = `This tool can be used to swap tokens to another token ( It uses Jupiter Exchange ).

  Inputs ( input is a JSON string ):
  outputMint: string, eg "So11111111111111111111111111111111111111112" or "SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa" (required)
  inputAmount: number, eg 1 or 0.01 (required)
  inputMint?: string, eg "So11111111111111111111111111111111111111112" (optional)
  slippageBps?: number, eg 100 (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const tx = await this.solanaKit.trade(
        new PublicKey(parsedInput.outputMint),
        parsedInput.inputAmount,
        parsedInput.inputMint
          ? new PublicKey(parsedInput.inputMint)
          : new PublicKey("So11111111111111111111111111111111111111112"),
        parsedInput.slippageBps
      );
      return "Trade executed successfully with tx " + tx+ " and inputAmount " + parsedInput.inputAmount+ " and inputToken " + parsedInput.inputMint+ " and outputToken " + parsedInput.outputMint;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaRequestFundsTool extends Tool {
  name = "solana_request_funds";
  description = "Request SOL from Solana faucet (devnet/testnet only)";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(_input: string): Promise<string> {
    try {
      await this.solanaKit.requestFaucetFunds();
      return "Funds requested successfully"+ " and network is " + this.solanaKit.connection.rpcEndpoint.split("/")[2];
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaGetWalletAddressTool extends Tool {
  name = "solana_get_wallet_address";
  description = `Get the wallet address of the agent`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    return this.solanaKit.wallet_address.toString();
  }
}

export class SolanaPumpfunTokenLaunchTool extends Tool {
  name = "solana_launch_pumpfun_token";

  description = `This tool can be used to launch a token on Pump.fun,
   do not use this tool for any other purpose, or for creating SPL tokens.
   If the user asks you to chose the parameters, you should generate valid values.
   For generating the image, you can use the solana_create_image tool.

   Inputs:
   tokenName: string, eg "PumpFun Token",
   tokenTicker: string, eg "PUMP",
   description: string, eg "PumpFun Token is a token on the Solana blockchain",
   imageUrl: string, eg "https://i.imgur.com/UFm07Np_d.png`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: any): void {
    if (!input.tokenName || typeof input.tokenName !== "string") {
      throw new Error("tokenName is required and must be a string");
    }
    if (!input.tokenTicker || typeof input.tokenTicker !== "string") {
      throw new Error("tokenTicker is required and must be a string");
    }
    if (!input.description || typeof input.description !== "string") {
      throw new Error("description is required and must be a string");
    }
    if (!input.imageUrl || typeof input.imageUrl !== "string") {
      throw new Error("imageUrl is required and must be a string");
    }
    if (
      input.initialLiquiditySOL !== undefined &&
      typeof input.initialLiquiditySOL !== "number"
    ) {
      throw new Error("initialLiquiditySOL must be a number when provided");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      // Parse and normalize input
      input = input.trim();
      let parsedInput = JSON.parse(input);

      this.validateInput(parsedInput);

      // Launch token with validated input
      await this.solanaKit.launchPumpFunToken(
        parsedInput.tokenName,
        parsedInput.tokenTicker,
        parsedInput.description,
        parsedInput.imageUrl,
        {
          twitter: parsedInput.twitter,
          telegram: parsedInput.telegram,
          website: parsedInput.website,
          initialLiquiditySOL: parsedInput.initialLiquiditySOL,
        }
      );
      return "Token launched successfully on Pump.fun and tokenName " + parsedInput.tokenName+ " and tokenTicker " + parsedInput.tokenTicker;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaCreateImageTool extends Tool {
  name = "solana_create_image";
  description =
    "Create an image using OpenAI's DALL-E. Input should be a string prompt for the image.";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: string): void {
    if (typeof input !== "string" || input.trim().length === 0) {
      throw new Error("Input must be a non-empty string prompt");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      this.validateInput(input);
      const result = await create_image(this.solanaKit, input.trim());
      return "Image created successfully with prompt."+ " and result " + result.images[0].toString();
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaLendAssetTool extends Tool {
  name = "solana_lend_asset";
  description = `Lend idle USDC for yield using Lulo. ( only USDC is supported )

  Inputs (input is a json string):
  amount: number, eg 1, 0.01 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let amount = JSON.parse(input).amount || input;

      const tx = await this.solanaKit.lendAssets(amount);
      return "Asset lent successfully with tx " + tx+ " and amount " + amount;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaTPSCalculatorTool extends Tool {
  name = "solana_get_tps";
  description = "Get the current TPS of the Solana network";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    try {
      const tps = await this.solanaKit.getTPS();
      return `Solana (mainnet-beta) current transactions per second: ${tps}`;
    } catch (error: any) {
      return `Error fetching TPS: ${error.message}`;
    }
  }
}

export class SolanaStakeTool extends Tool {
  name = "solana_stake";
  description = `This tool can be used to stake your SOL (Solana), also called as SOL staking or liquid staking.

  Inputs ( input is a JSON string ):
  amount: number, eg 1 or 0.01 (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input) || Number(input);

      const tx = await this.solanaKit.stake(parsedInput.amount);
      return "Staked successfully with tx " + tx+ " and amount " + parsedInput.amount;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

/**
 * Tool to fetch the price of a token in USDC
 */
export class SolanaFetchPriceTool extends Tool {
  name = "solana_fetch_price";
  description = `Fetch the price of a given token in USDC.
  
  Inputs:
  - tokenId: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const price = await fetchPrice(this.solanaKit, input.trim());
      return "Price fetched successfully with price " + price+ " and tokenId " + input.trim();
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaTokenDataTool extends Tool {
  name = "solana_token_data";
  description = `Get the token data for a given token mint address

  Inputs: mintAddress is required.
  mintAddress: string, eg "So11111111111111111111111111111111111111112" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = input.trim();

      const tokenData = await this.solanaKit.getTokenDataByAddress(parsedInput);
      return "Token data fetched successfully with tokenData " + tokenData+ " and mintAddress " + parsedInput;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaTokenDataByTickerTool extends Tool {
  name = "solana_token_data_by_ticker";
  description = `Get the token data for a given token ticker

  Inputs: ticker is required.
  ticker: string, eg "USDC" (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const ticker = input.trim();
      const tokenData = await this.solanaKit.getTokenDataByTicker(ticker);
      return "Token data fetched successfully with tokenData " + tokenData+ " and ticker " + ticker;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaCompressedAirdropTool extends Tool {
  name = "solana_compressed_airdrop";
  description = `Airdrop SPL tokens with ZK Compression (also called as airdropping tokens)
  
  Inputs (input is a JSON string):
  mintAddress: string, the mint address of the token, e.g., "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" (required)
  amount: number, the amount of tokens to airdrop per recipient, e.g., 42 (required)
  decimals: number, the decimals of the token, e.g., 6 (required)
  recipients: string[], the recipient addresses, e.g., ["1nc1nerator11111111111111111111111111111111"] (required)
  priorityFeeInLamports: number, the priority fee in lamports. Default is 30_000. (optional)
  shouldLog: boolean, whether to log progress to stdout. Default is false. (optional)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const txs = await this.solanaKit.sendCompressedAirdrop(
        parsedInput.mintAddress,
        parsedInput.amount,
        parsedInput.decimals,
        parsedInput.recipients,
        parsedInput.priorityFeeInLamports || 30_000,
        parsedInput.shouldLog || false
      );
      return "Airdropped successfully with txs " + txs+ " and mintAddress " + parsedInput.mintAddress+ " and amount " + parsedInput.amount+ " and decimals " + parsedInput.decimals+ " and recipients " + parsedInput.recipients;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaCreateSingleSidedWhirlpoolTool extends Tool {
  name = "create_orca_single_sided_whirlpool";
  description = `Create a single-sided Whirlpool with liquidity.

  Inputs (input is a JSON string):
  - depositTokenAmount: number, eg: 1000000000 (required, in units of deposit token including decimals)
  - depositTokenMint: string, eg: "DepositTokenMintAddress" (required, mint address of deposit token)
  - otherTokenMint: string, eg: "OtherTokenMintAddress" (required, mint address of other token)
  - initialPrice: number, eg: 0.001 (required, initial price of deposit token in terms of other token)
  - maxPrice: number, eg: 5.0 (required, maximum price at which liquidity is added)
  - feeTier: number, eg: 0.30 (required, fee tier for the pool)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const inputFormat = JSON.parse(input);
      const depositTokenAmount = new BN(inputFormat.depositTokenAmount);
      const depositTokenMint = new PublicKey(inputFormat.depositTokenMint);
      const otherTokenMint = new PublicKey(inputFormat.otherTokenMint);
      const initialPrice = new Decimal(inputFormat.initialPrice);
      const maxPrice = new Decimal(inputFormat.maxPrice);
      const feeTier = inputFormat.feeTier;

      if (!feeTier || !(feeTier in FEE_TIERS)) {
        throw new Error(`Invalid feeTier. Available options: ${Object.keys(FEE_TIERS).join(", ")}`);
      }

      const txId = await this.solanaKit.createOrcaSingleSidedWhirlpool(
        depositTokenAmount,
        depositTokenMint,
        otherTokenMint,
        initialPrice,
        maxPrice,
        feeTier,
      );
      return "Single-sided Whirlpool created successfully with txId " + txId;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}


export class SolanaRaydiumCreateAmmV4 extends Tool {
  name = "raydium_create_ammV4";
  description = `Raydium's Legacy AMM that requiers an OpenBook marketID

  Inputs (input is a json string):
  marketId: string (required)
  baseAmount: number(int), eg: 111111 (required)
  quoteAmount: number(int), eg: 111111 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.raydiumCreateAmmV4(
        new PublicKey(inputFormat.marketId),
        new BN(inputFormat.baseAmount),
        new BN(inputFormat.quoteAmount),
        new BN(inputFormat.startTime),
      );
      return "Create raydium amm v4 pool successfully with tx " + tx;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaRaydiumCreateClmm extends Tool {
  name = "raydium_create_clmm";
  description = `Concentrated liquidity market maker, custom liquidity ranges, increased capital efficiency

  Inputs (input is a json string):
  mint1: string (required)
  mint2: string (required)
  configId: string (required) stores pool info, id, index, protocolFeeRate, tradeFeeRate, tickSpacing, fundFeeRate
  initialPrice: number, eg: 123.12 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.raydiumCreateClmm(
        new PublicKey(inputFormat.mint1),
        new PublicKey(inputFormat.mint2),

        new PublicKey(inputFormat.configId),

        new Decimal(inputFormat.initialPrice),
        new BN(inputFormat.startTime),
      );
      return "Create raydium clmm pool successfully with tx " + tx;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaRaydiumCreateCpmm extends Tool {
  name = "raydium_create_cpmm";
  description = `Raydium's newest CPMM, does not require marketID, supports Token 2022 standard 

  Inputs (input is a json string):
  mint1: string (required)
  mint2: string (required)
  configId: string (required), stores pool info, index, protocolFeeRate, tradeFeeRate, fundFeeRate, createPoolFee
  mintAAmount: number(int), eg: 1111 (required)
  mintBAmount: number(int), eg: 2222 (required)
  startTime: number(seconds), eg: now number or zero (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.raydiumCreateCpmm(
        new PublicKey(inputFormat.mint1),
        new PublicKey(inputFormat.mint2),

        new PublicKey(inputFormat.configId),

        new BN(inputFormat.mintAAmount),
        new BN(inputFormat.mintBAmount),

        new BN(inputFormat.startTime),
      );
      return "Create raydium cpmm pool successfully with tx " + tx;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaOpenbookCreateMarket extends Tool {
  name = "solana_openbook_create_market";
  description = `Openbook marketId, required for ammv4 

  Inputs (input is a json string):
  baseMint: string (required)
  quoteMint: string (required)
  lotSize: number (required)
  tickSize: number (required)
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      let inputFormat = JSON.parse(input)

      const tx = await this.solanaKit.openbookCreateMarket(
        new PublicKey(inputFormat.baseMint),
        new PublicKey(inputFormat.quoteMint),

        inputFormat.lotSize,
        inputFormat.tickSize,
      );
      return "Create openbook market successfully with tx " + tx;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaRockPaperScissorsTool extends Tool {
  name = "rock_paper_scissors_blink";
  description = `Gamble while playing rock paper scissors.
  Inputs(convert the input to a json string):
  choice: string, either "rock", "paper", or "scissors" (required)
  amount: number, amount of SOL to play the game with, either 0.1, 0.01, or 0.005 SOL (required)`;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  private validateInput(input: any): void {
    if (input.choice !== undefined) {
      throw new Error('choice is required.');
    }
    if (
      input.amount !== undefined &&
      (typeof input.spaceKB !== "number" || input.spaceKB <= 0)
    ) {
      throw new Error("amount must be a positive number when provided");
    }
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = toJSON(input);
      this.validateInput(parsedInput);
      const result = await this.solanaKit.rockPaperScissors(
        Number(parsedInput['"amount"']),
        parsedInput['"choice"'].replace(/^"|"$/g, '') as "rock" | "paper" | "scissors"
      );
      return "https://raw.githubusercontent.com/The-x-35/rps-solana-blinks/refs/heads/main/public/1.jpeg\n"+ await result;
    } catch (error: any) {
      return "Sorry an error occurred. Please try again later.";
    }
  }
}

export class SolanaClaimBackTool extends Tool {
  name = "claim_back";
  description = `Claim back the funds from the agent's wallet. Or if the user asks for his private key.
  `;

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  protected async _call(): Promise<string> {
    try {
      const result = await this.solanaKit.claimBack();
      return result;
    } catch (error: any) {
      return "Sorry an error occurred here . Please try again later.";
    }
  }
}

export function createSolanaTools(solanaKit: SolanaAgentKit) {
  return [
    new SolanaBalanceTool(solanaKit),
    new SolanaTransferTool(solanaKit),
    new SolanaDeployTokenTool(solanaKit),
    new SolanaDeployCollectionTool(solanaKit),
    new SolanaMintNFTTool(solanaKit),
    new SolanaTradeTool(solanaKit),
    new SolanaRequestFundsTool(solanaKit),
    new SolanaGetWalletAddressTool(solanaKit),
    new SolanaPumpfunTokenLaunchTool(solanaKit),
    new SolanaCreateImageTool(solanaKit),
    new SolanaLendAssetTool(solanaKit),
    new SolanaTPSCalculatorTool(solanaKit),
    new SolanaStakeTool(solanaKit),
    new SolanaFetchPriceTool(solanaKit),
    new SolanaTokenDataTool(solanaKit),
    new SolanaTokenDataByTickerTool(solanaKit),
    new SolanaCompressedAirdropTool(solanaKit),
    new SolanaRaydiumCreateAmmV4(solanaKit),
    new SolanaRaydiumCreateClmm(solanaKit),
    new SolanaRaydiumCreateCpmm(solanaKit),
    new SolanaOpenbookCreateMarket(solanaKit),
    new SolanaCreateSingleSidedWhirlpoolTool(solanaKit),
    new SolanaRockPaperScissorsTool(solanaKit),
    new SolanaClaimBackTool(solanaKit),
  ];
}
