import { ExecuteResult, JsonObject, SigningCosmWasmClient, SigningCosmWasmClientOptions } from "@cosmjs/cosmwasm-stargate";
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve, stringToPath } from "@cosmjs/crypto";
import { fromBase64 } from "@cosmjs/encoding";
import { AccountData, Coin, DirectSecp256k1Wallet, OfflineSigner } from "@cosmjs/proto-signing";
import { GasPrice, HttpEndpoint, StdFee } from "@cosmjs/stargate";
import * as Indicators from "@ixjb94/indicators-js";
import cacheManager, { Cacheable, CacheManagerOptions } from "@type-cacheable/core";
import { useAdapter } from "@type-cacheable/lru-cache-adapter";
import Decimal from 'decimal.js';
import { LRUCache } from 'lru-cache';
import { properties } from "./properties";
import {
	Amount,
	Balances,
	BaseBalance,
	BaseBalanceWithQuotation,
	BaseTokenBalance,
	Candle,
	CandleInterval,
	DECIMAL_0,
	DECIMAL_1,
	DECIMAL_INFINITY,
	DECIMAL_NaN,
	FinCancelAllOrdersRequest,
	FinCancelAllOrdersResponse,
	FinCancelOrderRequest,
	FinCancelOrderResponse,
	FinCancelOrdersRequest,
	FinCancelOrdersResponse,
	FinConstructorOptions,
	FinGetAllMarketsRequest,
	FinGetAllMarketsResponse,
	FinGetAllTokensRequest,
	FinGetAllTokensResponse,
	FinGetBalancesRequest,
	FinGetBalancesResponse,
	FinGetCandlesRequest,
	FinGetCandlesResponse,
	FinGetIndicatorsRequest,
	FinGetIndicatorsResponse,
	FinGetMarketRequest,
	FinGetMarketResponse,
	FinGetMarketsRequest,
	FinGetMarketsResponse,
	FinGetOrderBookRequest,
	FinGetOrderBookResponse,
	FinGetOrderRequest,
	FinGetOrderResponse,
	FinGetOrdersRequest,
	FinGetOrdersResponse,
	FinGetStatusRequest,
	FinGetStatusResponse,
	FinGetTickerRequest,
	FinGetTickerResponse,
	FinGetTokenRequest,
	FinGetTokenResponse,
	FinGetTokensRequest,
	FinGetTokensResponse,
	FinGetTransactionRequest,
	FinGetTransactionResponse,
	FinInitializeOptions,
	FinPlaceOrderRequest,
	FinPlaceOrderResponse,
	FinPlaceOrdersRequest,
	FinPlaceOrdersResponse,
	FinReplaceOrderRequest,
	FinReplaceOrderResponse,
	FinReplaceOrdersRequest,
	FinReplaceOrdersResponse,
	FinExecuteOrdersRequest,
	FinExecuteOrdersResponse,
	FinWithdrawRequest,
	FinWithdrawResponse,
	Indicator,
	IndicatorData,
	Integer,
	List,
	Map,
	Market,
	MarketAddress,
	MarketStatus,
	MarketSymbol,
	MList,
	MMap,
	Order,
	OrderBook,
	OrderBookOrder,
	OrderBookPrice,
	OrderId,
	OrderSide,
	OrderStatus,
	OrderType,
	RujiraConstructorOptions,
	RujiraInitializeOptions,
	SystemStatus,
	Ticker,
	TickerPrice,
	Token,
	TokenAddress,
	TokenBalance,
	TokenSymbol,
	Transaction,
	TransactionHash,
	TransactionStatus,
	URL,
	Wallet,
	WalletAddress,
	WalletMnemonic,
	WalletPrivateKey,
	DECIMAL_10,
	OrderPrice
} from "./types";
import { getOrThrow, runWithRetryAndTimeout } from "./utils";

/**
 * LRU cache
 */
const lruCache = new LRUCache<string, any>({
	max: 999999,
	ttl: 1000* 60 * 60 * 24 * 365,
});

/**
 * Cache adapter
 */
const cacheAdapter = useAdapter(lruCache);

// Set cache manager options globally
cacheManager.setOptions(<CacheManagerOptions>{
	adapter: cacheAdapter,
});

/**
 * Rujira client
 */
export class Rujira {
	/**
	 * Fin client
	 */
	public readonly fin: Fin;

	/**
	 * Wallet address
	 */
	public walletAddress: WalletAddress;

	/**
	 * Wallet
	 */
	private wallet: Wallet;

	/**
	 * Wallet private key
	 */
	private readonly walletPrivateKey?: WalletPrivateKey;

	/**
	 * Wallet mnemonic
	 */
	private readonly walletMnemonic?: WalletMnemonic;

	/**
	 * Cosm client
	 */
	private cosmClient: SigningCosmWasmClient;

	/**
	 * Constructor
	 */
	constructor(options: RujiraConstructorOptions) {
		this.walletMnemonic = options.walletMnemonic;
		this.walletPrivateKey = options.walletPrivateKey;

		if (!this.walletMnemonic && !this.walletPrivateKey) {
			throw new Error('No wallet credentials provided. Please provide either a mnemonic or a private key');
		}

		this.wallet = undefined as unknown as Wallet;

		this.walletAddress = undefined as unknown as WalletAddress;

		this.cosmClient = undefined as unknown as SigningCosmWasmClient;

		this.fin = new Fin({
		} as FinConstructorOptions);
	}

	/**
	 * Initialize the client
	 */
	public async initialize(_options: RujiraInitializeOptions) {
		if (this.walletMnemonic) {
			this.wallet = await this.createWalletFromMnemonic(this.walletMnemonic);
		} else if (this.walletPrivateKey) {
			this.wallet = await this.createWalletFromPrivateKey(this.walletPrivateKey);
		} else {
			throw new Error('No wallet credentials provided. Please provide either a mnemonic or a private key');
		}

		this.walletAddress = this.wallet.firstAccount.address;

		properties.set('rujira.gasPrice', GasPrice.fromString(`0.02${properties.getAs<string>('rujira.constants.tokens.feePayment.symbol').toLowerCase()}`));

		this.cosmClient = await this.signingCosmWasmClientConnectWithSigner(
			properties.getAs<URL>('rujira.endpoints.rpc'),
			this.wallet.cosmWallet,
			{
				gasPrice: properties.getAs<GasPrice>('rujira.gasPrice')
			}
		);

		await this.fin.initialize(
			{
				wallet: this.wallet,
				cosmClient: this.cosmClient
			} as FinInitializeOptions
		);
	}

	/**
	 * Derive wallet private key from mnemonic
	 * @param mnemonic - The mnemonic to derive the private key from
	 * @returns The private key
	 */
	private async deriveWalletPrivateKeyFromMnemonic(mnemonic: string): Promise<string> {
		const englishMnemonic = new EnglishMnemonic(mnemonic);
		const seed = await this.bip39MnemonicToSeed(englishMnemonic);

		// Derive the private key using the THORChain HD path
		const hdPath = stringToPath("m/44'/931'/0'/0/0");
		const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);

		// Convert to base64
		const base64PrivateKey = Buffer.from(privkey).toString('base64');

		return base64PrivateKey;
	}

	/**
	 * Create wallet from private key
	 * @param privateKey - The private key to create the wallet from
	 * @returns The wallet
	 */
	private async createWalletFromPrivateKey(privateKey: WalletPrivateKey): Promise<Wallet> {
		const cosmWallet = await this.directSecp256k1WalletFromKeyfromKey(
			fromBase64(privateKey),
			properties.getAs<string>('wallet.prefix')
		);

		const firstAccount = getOrThrow<Array<AccountData>>(await this.directSecp256k1WalletGetAccounts(cosmWallet))[0];

		const wallet = {
			cosmWallet: cosmWallet,
			firstAccount: firstAccount
		};

		return wallet;
	}

	/**
	 * Create wallet from mnemonic
	 * @param mnemonic - The mnemonic to create the wallet from
	 * @returns The wallet
	 */
	private async createWalletFromMnemonic(mnemonic: string): Promise<Wallet> {
		const privateKey = await this.deriveWalletPrivateKeyFromMnemonic(mnemonic);

		return await this.createWalletFromPrivateKey(privateKey);
	}

	/**
	 * Get the accounts from a direct secp256k1 wallet
	 * @param wallet - The wallet to get the accounts from
	 * @returns The accounts
	 */
	@runWithRetryAndTimeout()
	private async directSecp256k1WalletGetAccounts(wallet: DirectSecp256k1Wallet): Promise<readonly AccountData[]> {
		return wallet.getAccounts();
	}

	/**
	 * Connect to the cosm client
	 * @param endpoint - The endpoint to connect to
	 * @param signer - The signer to use
	 * @param options - The options to use
	 * @returns The cosm client
	 */
	@runWithRetryAndTimeout()
	private async signingCosmWasmClientConnectWithSigner(endpoint: string | HttpEndpoint, signer: OfflineSigner, options?: SigningCosmWasmClientOptions): Promise<SigningCosmWasmClient> {
		return SigningCosmWasmClient.connectWithSigner(endpoint, signer, options);
	}

	/**
	 * Convert a mnemonic to a seed
	 * @param mnemonic - The mnemonic to convert
	 * @param password - The password to use
	 * @returns The seed
	 */
	@runWithRetryAndTimeout()
	private async bip39MnemonicToSeed(mnemonic: EnglishMnemonic, password?: string): Promise<Uint8Array> {
		return Bip39.mnemonicToSeed(mnemonic, password);
	}

	/**
	 * Create a direct secp256k1 wallet from a key
	 * @param key - The key to create the wallet from
	 * @param prefix - The prefix to use
	 * @returns The wallet
	 */
	@runWithRetryAndTimeout()
	private async directSecp256k1WalletFromKeyfromKey(privkey: Uint8Array, prefix?: string): Promise<DirectSecp256k1Wallet> {
		return DirectSecp256k1Wallet.fromKey(privkey, prefix);
	}
}

/**
 * Fin client
 */
export class Fin {
	/**
	 * Wallet address
	 */
	private walletAddress: WalletAddress;

	/**
	 * Wallet
	 */
	private wallet: Wallet;

	/**
	 * Cosm client
	 */
	private cosmClient: SigningCosmWasmClient;

	/**
	 * Tokens by address
	 */
	private tokensByAddress: Map<TokenAddress, Token>;

	/**
	 * Tokens by symbol
	 */
	private tokensBySymbol: Map<TokenSymbol, Token>;

	/**
	 * Markets by address
	 */
	private marketsByAddress: Map<MarketAddress, Market>;

	/**
	 * Markets by name
	 */
	private marketsBySymbol: Map<MarketSymbol, Market>;

	/**
	 * Native token
	 */
	public nativeToken: Token;

	/**
	 * Beacon token
	 */
	public beaconToken: Token;

	/**
	 * Fee payment token
	 */
	public feePaymentToken: Token;

	/**
	 * Constructor
	 * @param options - The constructor options
	 */
	constructor(options: FinConstructorOptions) {
		this.walletAddress = undefined as unknown as WalletAddress;
		this.wallet = undefined as unknown as Wallet;
		this.cosmClient = undefined as unknown as SigningCosmWasmClient;

		this.tokensByAddress = MMap<TokenAddress, Token>();
		this.tokensBySymbol = MMap<TokenSymbol, Token>();
		this.marketsByAddress = MMap<MarketAddress, Market>();
		this.marketsBySymbol = MMap<MarketSymbol, Market>();

		this.nativeToken = undefined as unknown as Token;
		this.beaconToken = undefined as unknown as Token;
		this.feePaymentToken = undefined as unknown as Token;
	}

	/**
	 * Get wallet address
	 * @param walletAddress - The wallet address
	 * @param wallet - The wallet
	 * @returns The wallet address
	 */
	private getWalletAddress(walletAddress?: WalletAddress, wallet?: Wallet): WalletAddress {
		if (walletAddress) {
			return walletAddress.trim().toLowerCase();
		}

		if (wallet) {
			return wallet.firstAccount.address.trim().toLowerCase();
		}

		if (this.wallet.firstAccount) {
			return this.wallet.firstAccount.address.trim().toLowerCase();
		}

		throw new Error('No wallet address provided');
	}

	/**
	 * Initialize the client
	 * @param options - The initialize options
	 */
	async initialize(options: FinInitializeOptions): Promise<void> {
		this.walletAddress = options.walletAddress;
		this.wallet = options.wallet;
		this.cosmClient = options.cosmClient;

		await this.getAllTokens({} as FinGetAllTokensRequest);
		await this.getAllMarkets({} as FinGetAllMarketsRequest);

		this.nativeToken = await this.getToken({ address: properties.getAs<TokenAddress>('rujira.constants.tokens.native.address') });
		this.beaconToken = await this.getToken({ address: properties.getAs<TokenAddress>('rujira.constants.tokens.beacon.address') });
		this.feePaymentToken = await this.getToken({ address: properties.getAs<TokenAddress>('rujira.constants.tokens.feePayment.address') });

		properties.set('rujira.tokens.native', this.nativeToken);
		properties.set('rujira.tokens.beacon', this.beaconToken);
		properties.set('rujira.tokens.feePayment', this.feePaymentToken);
	}

	/**
	 * Get status
	 * @param request - The request object
	 * @returns The status response
	 */
	async getStatus(_request: FinGetStatusRequest): Promise<FinGetStatusResponse> {
		try {
			// Check if client is initialized and can connect
			if (!this.cosmClient) {
				return {
					error: 'Client not initialized. Please call initialize() first.',
					status: SystemStatus.DOWN
				} as FinGetStatusResponse;
			}

			// Try to get chain height to verify connection
			await this.cosmClientGetHeight;

			return {
				status: SystemStatus.UP
			} as FinGetStatusResponse;
		} catch (error) {
			const errorMessage = error instanceof Error
				? `Connection failed: ${error.message}`
				: 'Connection failed: Unknown error';

			return {
				error: errorMessage,
				status: SystemStatus.DOWN
			} as FinGetStatusResponse;
		}
	}

	/**
	 * Get transaction details by hash
	 * @param request - The request object
	 * @returns The transaction response
	 */
	@runWithRetryAndTimeout({})
	async getTransaction(request: FinGetTransactionRequest): Promise<FinGetTransactionResponse> {
		let { hash, waitForConfirmation } = request;

		hash = hash?.trim();

		if (!hash) {
			throw new Error("Transaction hash is required and cannot be empty");
		}

		let rawTransaction: any;

		// TOOD: verify how to retrieve the transaction directly calling the RPC endpoint!!!
		// rawTransaction = await this.cosmClientGetTx(hash);

		const url = `${properties.getAs<URL>('rujira.endpoints.rest')}/cosmos/tx/v1beta1/txs/${hash}`;
		// TODO: add a example response!!!
		const response = await this.fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!response.ok) {
			throw new Error(`REST request failed: ${response.status} ${response.statusText}`);
		}

		rawTransaction = await response.json() as {
			tx: {
				body: {
					messages: Array<{
						"@type": string;
						sender: string;
						contract: string;
						msg: {
							order: [
								[
									Array<["quote" | string, { fixed: string } | unknown, string]>,
									null
								]
							];
						};
						funds: Array<{
							denom: string;
							amount: string;
						}>;
					}>;
					memo: string;
					timeout_height: string;
					extension_options: unknown[];
					non_critical_extension_options: unknown[];
				};
				auth_info: {
					signer_infos: Array<{
						public_key: {
							"@type": string;
							key: string;
						};
						mode_info: {
							single: {
								mode: string;
							};
						};
						sequence: string;
					}>;
					fee: {
						amount: Array<{
							denom: string;
							amount: string;
						}>;
						gas_limit: string;
						payer: string;
						granter: string;
					};
					tip: null;
				};
				signatures: string[];
			};
			tx_response: {
				height: string;
				txhash: string;
				codespace: string;
				code: number;
				data: string;
				raw_log: string;
				logs: unknown[];
				info: string;
				gas_wanted: string;
				gas_used: string;
				tx: {
					"@type": string;
					body: {
						messages: Array<{
							"@type": string;
							sender: string;
							contract: string;
							msg: {
								order: [
									[
										Array<["quote" | string, { fixed: string } | unknown, string]>,
										null
									]
								];
							};
							funds: Array<{
								denom: string;
								amount: string;
							}>;
						}>;
						memo: string;
						timeout_height: string;
						extension_options: unknown[];
						non_critical_extension_options: unknown[];
					};
					auth_info: {
						signer_infos: Array<{
							public_key: {
								"@type": string;
								key: string;
							};
							mode_info: {
								single: {
									mode: string;
								};
							};
							sequence: string;
						}>;
						fee: {
							amount: Array<{
								denom: string;
								amount: string;
							}>;
							gas_limit: string;
							payer: string;
							granter: string;
						};
						tip: null;
					};
					signatures: string[];
				};
				timestamp: string;
				events: Array<{
					type: string;
					attributes: Array<{
						key: string;
						value: string;
						index: boolean;
						msg_index?: string;
					}>;
				}>;
			};
		};

		if (!rawTransaction) {
			throw new Error(`Transaction not found: ${hash}`);
		}

		let status;
		if (rawTransaction.tx_response.code === 0) {
			status = TransactionStatus.SUCCESS;
		} else if (rawTransaction.tx_response.code === 1) {
			status = TransactionStatus.FAILED;
		} else {
			status = TransactionStatus.PENDING;
		}

		if (waitForConfirmation && status === TransactionStatus.PENDING) {
			throw new Error(`Transaction is still pending: ${hash}`);
		}

		const feeToken = await this.getToken({ symbol: rawTransaction.tx.auth_info.fee.amount[0].denom.toUpperCase() });
		const feeAmount = rawTransaction.tx.auth_info.fee.amount[0].amount ? Decimal(rawTransaction.tx.auth_info.fee.amount[0].amount).div(Decimal(10).pow(feeToken.decimals)) : DECIMAL_0;

		const result = {
			hash: rawTransaction.tx_response.txhash,
			status: status,
			fee: {
				amount: feeAmount,
				token: feeToken,
			},
			raw: rawTransaction
		};

		return result;
	}

	/**
	 * Get token by address or symbol
	 * @param request - The request object
	 * @returns The token response
	 */
	async getToken(request: FinGetTokenRequest): Promise<FinGetTokenResponse> {
		await this.getAllTokens({} as FinGetAllTokensRequest);

		let { address, symbol } = request;

		address = address?.trim()?.toLowerCase();
		symbol = symbol?.trim()?.toUpperCase();

		if (!address && !symbol) {
			throw new Error("You must provide a non-empty address or symbol");
		}

		if (address) {
			return this.tokensByAddress.getOrThrow(address, undefined, true);
		} else if (symbol) {
			return this.tokensBySymbol.getOrThrow(symbol, undefined, true);
		}

		throw new Error(`Token not found: ${address || symbol}`);
	}

	/**
	 * Get multiple tokens by addresses and/or symbols
	 * @param request - The request object
	 * @returns The tokens response
	 */
	async getTokens(request: FinGetTokensRequest): Promise<FinGetTokensResponse> {
		await this.getAllTokens({} as FinGetAllTokensRequest);

		let { addresses, symbols } = request;

		if (addresses) {
			if (Array.isArray(addresses)) {
				addresses = MList<TokenAddress>(addresses);
			}

			addresses = addresses
				.map((address: TokenAddress) => address?.trim()?.toLowerCase())
				.filter((address: TokenAddress) => address);
		}

		if (symbols) {
			if (Array.isArray(symbols)) {
				symbols = MList<TokenSymbol>(symbols);
			}

			symbols = symbols
				.map((symbol: TokenSymbol) => symbol?.trim()?.toUpperCase())
				.filter((symbol: TokenSymbol) => symbol);
		}

		if (!addresses?.size && !symbols?.size) {
			throw new Error("You must provide at least one non-empty address or symbol");
		}

		if (addresses?.size) {
			addresses = getOrThrow<List<TokenAddress>>(addresses);
		}
		if (symbols?.size) {
			symbols = getOrThrow<List<TokenSymbol>>(symbols);
		}

		const tokens = MMap<TokenAddress, Token>();

		if (addresses?.size) {
			addresses.forEach((address: TokenAddress) => {
				const token = this.tokensByAddress.getOrThrow(address, undefined, true);
				if (!token) throw new Error(`Token not found: ${address}`);
				tokens.set(token.address, token, true);
			});
		}

		if (symbols?.size) {
			symbols.forEach((symbol: TokenSymbol, index: number) => {
				const token = this.tokensBySymbol.getOrThrow(symbol, undefined, true);
				if (!token) throw new Error(`Token not found: ${symbol}`);
				tokens.set(token.address, token, true);
			});
		}

		return tokens;
	}

	/**
	 * Get all tokens
	 * @param request - The request object
	 * @returns The tokens response
	 */
	@Cacheable({
		cacheKey: (_request: FinGetAllTokensRequest) => `getAllTokens(${_request.toString()})`,
		ttlSeconds: properties.getAs<number>('rujira.cache.fin.getAllTokens'),
	})
	async getAllTokens(_request: FinGetAllTokensRequest): Promise<FinGetAllTokensResponse> {
		// Get all markets first (this already contains all token data)
		const markets = await this.getAllMarkets({} as FinGetAllMarketsRequest);

		const tokens = MMap<TokenAddress, Token>();

		// Extract all unique tokens from the markets
		for (const market of markets.values()) {
			// Add base token if not already added
			if (!tokens.has(market.tokens.base.address, true)) {
				tokens.set(market.tokens.base.address, market.tokens.base, true);
			}

			// Add quote token if not already added
			if (!tokens.has(market.tokens.quote.address, true)) {
				tokens.set(market.tokens.quote.address, market.tokens.quote, true);
			}
		}

		// Update internal maps
		for (const token of tokens.values()) {
			this.tokensByAddress.set(token.address, token, true);
			this.tokensBySymbol.set(token.symbol.toUpperCase(), token, true);
		}

		return tokens;
	}

	/**
	 * Get market by address or symbol
	 * @param request - The request object
	 * @returns The market response
	 */
	async getMarket(request: FinGetMarketRequest): Promise<FinGetMarketResponse> {
		await this.getAllMarkets({} as FinGetAllMarketsRequest);

		let { address, symbol } = request;

		address = address?.trim()?.toLowerCase();
		symbol = symbol?.trim()?.toUpperCase();

		if (!address && !symbol) {
			throw new Error("You must provide a non-empty address or symbol");
		}

		if (address) {
			return this.marketsByAddress.getOrThrow(address);
		} else if (symbol) {
			return this.marketsBySymbol.getOrThrow(symbol);
		}

		throw new Error(`Market not found: ${address || symbol}`);
	}

	/**
	 * Get multiple markets by addresses and/or symbols
	 * @param request - The request object
	 * @returns The markets response
	 */
	async getMarkets(request: FinGetMarketsRequest): Promise<FinGetMarketsResponse> {
		await this.getAllMarkets({} as FinGetAllMarketsRequest);

		let { addresses, symbols } = request;

		if (addresses) {
			if (Array.isArray(addresses)) {
				addresses = MList<MarketAddress>(addresses);
			}

			addresses = addresses
				.map((address: MarketAddress) => address?.toLowerCase().trim())
				.filter((address: MarketAddress) => address);
		} else {
			addresses = MList<MarketAddress>();
		}

		if (symbols) {
			if (Array.isArray(symbols)) {
				symbols = MList<MarketSymbol>(symbols);
			}

			symbols = symbols
				.map((symbol: MarketSymbol) => symbol?.toUpperCase().trim())
				.filter((symbol: MarketSymbol) => symbol);
		} else {
			symbols = MList<MarketSymbol>();
		}

		if (!addresses?.size && !symbols?.size) {
			throw new Error("You must provide at least one non-empty address or symbol");
		}

		addresses = getOrThrow<List<MarketAddress>>(addresses);
		symbols = getOrThrow<List<MarketSymbol>>(symbols);

		const markets = MMap<MarketAddress, Market>();

		addresses.forEach((address: MarketAddress) => {
			const market = this.marketsByAddress.getOrThrow(address);
			if (!market) throw new Error(`Market not found: ${address}`);
			markets.set(address, market);
		});

		symbols.forEach((symbol: MarketSymbol) => {
			const market = this.marketsBySymbol.getOrThrow(symbol);
			if (!market) throw new Error(`Market not found: ${symbol}`);
			markets.set(market.address, market);
		});

		return markets;
	}

	/**
	 * Get all markets
	 * @param request - The request object
	 * @returns The markets response
	 */
	@Cacheable({
		cacheKey: (request: FinGetAllMarketsRequest) => `getAllMarkets(${request.toString()})`,
		ttlSeconds: properties.getAs<number>('rujira.cache.fin.getAllMarkets'),
	})
	async getAllMarkets(_request: FinGetAllMarketsRequest): Promise<FinGetAllMarketsResponse> {
		const graphQLEndPoint = properties.getAs<URL>('rujira.endpoints.graphql');

		const query = `
			query {
				rujira {
					fin {
						id
						address
						tick
						feeTaker
						feeMaker
						feeAddress
						deploymentStatus

						# Asset Base
						assetBase {
							id
							asset
							type
							chain
							metadata {
								symbol
								name
								decimals
								description
								display
							}
							price {
								current
								changeDay
								mcap
								timestamp
							}
							variants {
								layer1 { asset }
								secured { asset }
								native { denom }
							}
						}

						# Asset Quote
						assetQuote {
							id
							asset
							type
							chain
							metadata {
								symbol
								name
								decimals
								description
								display
							}
							price {
								current
								changeDay
								mcap
								timestamp
							}
							variants {
								layer1 { asset }
								secured { asset }
								native { denom }
							}
						}

						# Oracles
						oracleBase {
							id
							asset {
								asset
								metadata { symbol name decimals }
							}
							price
						}
						oracleQuote {
							id
							asset {
								asset
								metadata { symbol name decimals }
							}
							price
						}
					}
				}
			}`;

		const response = await this.fetch(graphQLEndPoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query })
		});

		if (!response.ok) {
			throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
		}

		const json: any = await response.json();
		const { data, errors } = json;

		if (errors) {
			throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
		}

		const rawPairs = data?.rujira?.fin || [];
		const markets = MMap<MarketAddress, Market>();

		for (const pair of rawPairs) {
			// Only include LIVE markets
			if (pair.deploymentStatus !== properties.getAs<string>('rujira.constants.enum.markets.active')) {
				continue;
			}

			// Create base token
			const baseToken: Token = {
				address: pair.assetBase.asset.toLowerCase(),
				symbol: pair.assetBase.metadata?.symbol?.toUpperCase() || pair.assetBase.asset?.toUpperCase(),
				name: pair.assetBase.metadata?.name || pair.assetBase.metadata?.symbol || pair.assetBase.asset,
				decimals: pair.assetBase.metadata?.decimals,
				raw: pair.assetBase
			};

			// Create quote token
			const quoteToken: Token = {
				address: pair.assetQuote.asset.toLowerCase(),
				symbol: pair.assetQuote.metadata?.symbol?.toUpperCase() || pair.assetQuote.asset?.toUpperCase(),
				name: pair.assetQuote.metadata?.name || pair.assetQuote.metadata?.symbol || pair.assetQuote.asset,
				decimals: pair.assetQuote.metadata?.decimals,
				raw: pair.assetQuote
			};

			// Create market symbol
			const marketSymbol = `${baseToken.symbol}/${quoteToken.symbol}`.toUpperCase();

			// Create market object
			const market: Market = {
				address: pair.address.toLowerCase(),
				symbol: marketSymbol,
				tokens: {
					base: baseToken,
					quote: quoteToken
				},
				decimals: Number(pair.tick) || 8, // Use tick as decimals, ensure it's a number
				status: MarketStatus.ACTIVE, // LIVE markets are active
				raw: pair
			};

			markets.set(pair.address.toLowerCase(), market);
		}

		// Update internal maps
		for (const market of markets.values()) {
			this.marketsByAddress.set(market.address, market);
			this.marketsBySymbol.set(market.symbol, market);
		}

		return markets;
	}

	/**
	 * Get order book (always fetches latest from CosmWasm contract)
	 * @param request - The request object
	 * @returns The order book response
	 */
	async getOrderBook(request: FinGetOrderBookRequest): Promise<FinGetOrderBookResponse> {
		let { marketAddress, marketSymbol, market, maximumNumberOfOrders } = request;

		marketAddress = marketAddress?.toLowerCase().trim();
		marketSymbol = marketSymbol?.toLowerCase().trim();
		maximumNumberOfOrders = maximumNumberOfOrders || properties.getAs<number>('rujira.default.orderBook.maximumNumberOfOrders') || DECIMAL_INFINITY.toNumber();

		if (!marketAddress && !marketSymbol && !market) {
			throw new Error("Either market address or market name or market must be provided");
		}

		if (!market) {
			market = await this.getMarket({ address: marketAddress, symbol: marketSymbol });
		}

		// TODO: add an example response!!!
		// TODO: add an interface for the response!!!
		const rawOrderBook = await this.cosmClientQueryContractSmart(
			market.address,
			{
				book: {
					limit: maximumNumberOfOrders
				}
			}
		);

		const parseOrder = (entry: any): OrderBookOrder => ({
			price: new Decimal(entry.price),
			amount: new Decimal(entry.total),
			raw: entry
		});

		let asks: List<OrderBookOrder> = MList<OrderBookOrder>(rawOrderBook.base || []).map(parseOrder);
		let bids: List<OrderBookOrder> = MList<OrderBookOrder>(rawOrderBook.quote || []).map(parseOrder);

		asks = maximumNumberOfOrders ? asks.slice(0, maximumNumberOfOrders) : asks;
		bids = maximumNumberOfOrders ? bids.slice(0, maximumNumberOfOrders) : bids;

		const bestAsk: OrderBookOrder = asks.size > 0 ? asks.getOrThrow(0) : undefined as unknown as OrderBookOrder;
		const bestBid: OrderBookOrder = bids.size > 0 ? bids.getOrThrow(0) : undefined as unknown as OrderBookOrder;

		let baseToQuoteMiddlePrice: OrderBookPrice | undefined;
		if (!asks.isEmpty() && !bids.isEmpty()) {
			baseToQuoteMiddlePrice = bestAsk.price.plus(bestBid.price).div(2);
		} else if (!asks.isEmpty() && bids.isEmpty()) {
			baseToQuoteMiddlePrice = bestAsk.price;
		} else if (asks.isEmpty() && !bids.isEmpty()) {
			baseToQuoteMiddlePrice = bestBid.price;
		}

		let baseToQuoteVolumeWeightedAveragePrice: OrderBookPrice | undefined;

		const orderBook: OrderBook = {
			market,
			book: {
				asks,
				bids,
				bestAsk,
				bestBid,
			},
			statistics: {
				middlePrice: {
					baseToQuote: baseToQuoteMiddlePrice,
					quoteToBase: baseToQuoteMiddlePrice ? DECIMAL_1.div(baseToQuoteMiddlePrice) : undefined
				},
				volumeWeightedAveragePrice: {
					baseToQuote: baseToQuoteVolumeWeightedAveragePrice,
					quoteToBase: baseToQuoteVolumeWeightedAveragePrice ? DECIMAL_1.div(baseToQuoteVolumeWeightedAveragePrice) : undefined
				}
			},
			raw: rawOrderBook
		};

		return orderBook;
	}

	/**
	 * Get ticker
	 * @param request - The request object
	 * @returns The ticker response
	 */
	async getTicker(request: FinGetTickerRequest): Promise<FinGetTickerResponse> {
		let { marketAddress, marketSymbol, market } = request;

		marketAddress = marketAddress?.toLowerCase().trim();
		marketSymbol = marketSymbol?.toLowerCase().trim();

		if (!marketAddress && !marketSymbol && !market) {
			throw new Error("Either market address or market name or market must be provided");
		}

		if (!market) {
			market = await this.getMarket({ address: marketAddress, symbol: marketSymbol });
		}

		const orderBook = await this.getOrderBook({ marketAddress: market.address, marketSymbol: market.symbol, market: market, maximumNumberOfOrders: 1 });
		const timestamp = Date.now();

		const ticker: Ticker = {
			market,
			middlePrice: orderBook.statistics.middlePrice.baseToQuote,
			volumeWeightedAveragePrice: orderBook.statistics.volumeWeightedAveragePrice.baseToQuote,
			timestamp,
			raw: orderBook.raw
		};

		return ticker;
	}

		/**
	 * Get candles
	 * @param request - The request object
	 * @returns The candles response
	 */
	async getCandles(request: FinGetCandlesRequest): Promise<FinGetCandlesResponse> {
		let { marketAddress, marketSymbol, market, maximumNumberOfCandles, interval } = request;

		marketAddress = marketAddress?.toLowerCase().trim();
		marketSymbol = marketSymbol?.trim();
		maximumNumberOfCandles = maximumNumberOfCandles || properties.getAs<number>('rujira.default.candles.maximumNumberOfCandles') || DECIMAL_INFINITY.toNumber();
		interval = interval || properties.getAs<CandleInterval>('rujira.default.candles.interval') || '1m';

		if (!marketAddress && !marketSymbol && !market) {
			throw new Error("Either market address or market name or market must be provided");
		}

		if (!market) {
			market = await this.getMarket({ address: marketAddress, symbol: marketSymbol });
		}

		// Use interval directly as resolution (already in seconds format)
		const resolution = interval.replace('m', '');

		// Time range (last 7 days)
		const before = new Date().toISOString();
		const after = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

		// TODO: add a example response!!!
		const response = await this.fetch(properties.getAs<string>('rujira.endpoints.graphql'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `
					query($marketAddress: ID!, $after: String!, $before: String!, $resolution: String!, $last: Int) {
						node(id: $marketAddress) {
							... on FinPair {
								address
								candles(after: $after, before: $before, resolution: $resolution, last: $last) {
									edges {
										node {
											open
											close
											high
											low
											volume
											bin
										}
									}
								}
							}
						}
					}
				`,
				variables: {
					marketAddress: Buffer.from(`FinPair:${market.address}`).toString('base64'),
					after,
					before,
					resolution,
					last: maximumNumberOfCandles
				}
			})
		});

		if (!response.ok) {
			throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
		}

		// TODO: add a interface for the response!!!
		const json: any = (await response.json());
		const { data, errors } = json;

		if (errors) {
			throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);
		}

		// TODO: check if this is correct!!!
		const rawCandles = data?.node?.candles?.edges?.map((edge: any) => edge.node) || [];

		// TODO: check if this is correct!!!
		const candles = MList<Candle>(rawCandles).map((entry: any): Candle => ({
			timestamp: typeof entry.bin === 'string'
				? new Date(entry.bin).getTime()
				:typeof entry.bin === 'number' ? entry.bin : Date.now(),
			open: Decimal(entry.open || 0),
			high: Decimal(entry.high || 0),
			low: Decimal(entry.low || 0),
			close: Decimal(entry.close || 0),
			volume: Decimal(entry.volume || 0),
			raw: entry
		}));

		return candles;
	}

	/**
	 * Get indicators
	 * @param request - The request object
	 * @returns The indicators response
	 */
	async getIndicators(request: FinGetIndicatorsRequest): Promise<FinGetIndicatorsResponse> {
		let { candles, marketAddress, marketSymbol, market, maximumNumberOfCandles, interval } = request;

		if (!candles || candles.size === 0) {
			candles = await this.getCandles({ marketAddress, marketSymbol, market, maximumNumberOfCandles, interval });
		}

		const data = candles.map((candle: Candle) => candle.close.toNumber());

		const indicators = MMap<Indicator, IndicatorData>();

		for (const indicator of Indicator.getAll()) {
			const value = (Indicators as any)[indicator.id](data, ...indicator.defaultParameters);

			indicators.set(indicator, {
				indicator,
				value
			});
		}

		return indicators;
	}

	/**
	 * Get balances for a wallet (free, locked in orders, withdrawable, totals)
	 * @param request - The request object
	 * @returns The balances response
	 */
	async getBalances(request: FinGetBalancesRequest): Promise<FinGetBalancesResponse> {
		let { walletAddress, wallet, tokenAddresses, tokenSymbols } = request;

		walletAddress = this.getWalletAddress(walletAddress, wallet);
		tokenAddresses = tokenAddresses?.map((address: TokenAddress) => address.toLowerCase().trim()) || MList<TokenAddress>();
		tokenSymbols = tokenSymbols?.map((symbol: TokenSymbol) => symbol.toLowerCase().trim()) || MList<TokenSymbol>();

		if (!walletAddress && !wallet) {
			throw new Error('The wallet address or wallet is required');
		}

		if (Array.isArray(tokenAddresses)) {
			tokenAddresses = MList<TokenAddress>(tokenAddresses);
		}
		if (Array.isArray(tokenSymbols)) {
			tokenSymbols = MList<TokenSymbol>(tokenSymbols);
		}

		let markets = await this.getAllMarkets({} as FinGetAllMarketsRequest);
		let tokens = await this.getAllTokens({} as FinGetAllTokensRequest);

		if (tokenAddresses.size > 0 || tokenSymbols.size > 0) {
			tokens = tokens.filter((token: Token) => tokenAddresses.includes(token.address) || tokenSymbols.includes(token.symbol));
		}

		const freeBalances = MMap<TokenAddress, Amount>();
		const freeBalanceResponse = await this.fetch(`${properties.getAs<string>('rujira.endpoints.rest')}/cosmos/bank/v1beta1/balances/${walletAddress}`);
		if (freeBalanceResponse.ok) {
			/*
			Example response:
				{
					"balances": [
						{
							"denom": "eth-usdc-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
							"amount": "90505921"
						}
					],
					"pagination": {
						"next_key": null,
						"total": "6"
					}
				}
			*/
			const freeBalanceResponseData = (await freeBalanceResponse.json()) as {
				balances: Array<{
					denom: string;
					amount: string;
				}>;
				pagination: {
					next_key: string | null;
					total: string;
				};
			};

			for (const rawBalance of freeBalanceResponseData.balances) {
				const token = await this.getToken({ address: rawBalance.denom });

				freeBalances.set(token.address, new Decimal(rawBalance.amount));
			}
		}

		const lockedInOrdersMap = MMap<TokenAddress, Amount>();
		const withdrawableMap = MMap<TokenAddress, Amount>();

		for (const market of markets.values()) {
			/*
			Example response:
				{
					"orders": [
						{
							"owner": "thor1gsgx5xtw82r8qw06mrcxjzypuynqwjxcugk5fy",
							"side": "base",
							"price": {
								"fixed": "0.219169"
							},
							"rate": "0.219169",
							"updated_at": "1752680298782095574",
							"offer": "10000000",
							"remaining": "10000000",
							"filled": "0"
						}
					]
				}
			*/
			const ordersResponse = await this.cosmClientQueryContractSmart(
				market.address,
				{
					orders: {
						owner: walletAddress,
						limit: properties.getOrDefault<Integer>('rujira.default.orders.maximumNumberOfOrders', DECIMAL_INFINITY.toNumber())
					}
				}
			) as {
				orders: Array<{
					owner: string,
					"side": string,
					"price": {
						"fixed": string
					},
					"rate": string,
					"updated_at": string,
					"offer": string,
					"remaining": string,
					"filled": string
				}>;
			};

			for (const rawOrder of ordersResponse.orders) {
				const baseTokenAddress = market.tokens.base.address;
				const quoteTokenAddress = market.tokens.quote.address;

				if (rawOrder.filled && Number(rawOrder.filled) > 0) {
					// TODO: check if this is correct!!!
					const lockedTokenAddress = rawOrder.side === 'base' ? baseTokenAddress : quoteTokenAddress;
					lockedInOrdersMap.get(lockedTokenAddress, (lockedInOrdersMap.get(lockedTokenAddress, DECIMAL_0)).plus(new Decimal(rawOrder.filled)));
				}
				if (rawOrder.filled && Number(rawOrder.filled) === Number(rawOrder.offer)) {
					// TODO: check if this is correct!!!
					const withdrawTokenAddress = rawOrder.side === 'base' ? quoteTokenAddress : baseTokenAddress; // note that it's the opposite asset
					withdrawableMap.set(withdrawTokenAddress, (withdrawableMap.get(withdrawTokenAddress, DECIMAL_0)).plus(new Decimal(rawOrder.filled)));
				}
			}
		}

		const tokensBalancesMap = MMap<TokenAddress, TokenBalance>();
		for (const token of tokens.values()) {
			const free = freeBalances.get(token.address, DECIMAL_0);
			const lockedInOrders = lockedInOrdersMap.get(token.address, DECIMAL_0);
			const withdrawable = withdrawableMap.get(token.address, DECIMAL_0);
			const lockedInPools = DECIMAL_0; // Not implemented
			const total = free.plus(lockedInOrders).plus(lockedInPools).plus(withdrawable);

			const tokenBalance: BaseBalance = {
				free,
				lockedInOrders,
				lockedInPools,
				withdrawable,
				total
			};

			let conversionRateNativeToken: TickerPrice = DECIMAL_0;
			if (token.address !== this.nativeToken.address) {
				try {
					const quotingMarketTicker = await this.getTicker({ marketSymbol: `${token.symbol}/${this.nativeToken.symbol}` });

					conversionRateNativeToken = quotingMarketTicker.middlePrice || DECIMAL_0;
				} catch (exception) {
					ignoreException(exception);
				}
			} else {
				conversionRateNativeToken = DECIMAL_1;
			}

			let conversionRateBeacon: TickerPrice = DECIMAL_0;
			if (token.address !== this.beaconToken.address) {
				try {
					const quotingMarketTicker = await this.getTicker({ marketSymbol: `${token.symbol}/${this.beaconToken.symbol}` });

					conversionRateBeacon = quotingMarketTicker.middlePrice || DECIMAL_0;
				} catch (exception) {
					ignoreException(exception);
				}
			} else {
				conversionRateBeacon = DECIMAL_1;
			}

			const baseBalanceWithNativeQuotation: BaseBalanceWithQuotation = {
				...tokenBalance,
				quotation: {
					token: this.nativeToken || token,
					tokenToQuote: conversionRateNativeToken,
					quoteToToken: conversionRateNativeToken.gt(DECIMAL_0) ? DECIMAL_1.div(conversionRateNativeToken) : DECIMAL_0
				}
			};
			const baseBalanceWithBeaconQuotation: BaseBalanceWithQuotation = {
				...tokenBalance,
				quotation: {
					token: this.beaconToken || token,
					tokenToQuote: conversionRateBeacon,
					quoteToToken: conversionRateBeacon.gt(DECIMAL_0) ? DECIMAL_1.div(conversionRateBeacon) : DECIMAL_0
				}
			};

			const baseTokenBalance: BaseTokenBalance = {
				token: tokenBalance,
				nativeToken: baseBalanceWithNativeQuotation,
				beaconToken: baseBalanceWithBeaconQuotation
			};

			tokensBalancesMap.set(token.address, {
				token,
				balances: baseTokenBalance
			});
		}

		const totalNative: BaseBalance = {
			free: freeBalances.get(this.nativeToken.address, DECIMAL_0),
			lockedInOrders: lockedInOrdersMap.get(this.nativeToken.address, DECIMAL_0),
			lockedInPools: DECIMAL_0,
			withdrawable: withdrawableMap.get(this.nativeToken.address, DECIMAL_0),
			total: freeBalances.get(this.nativeToken.address, DECIMAL_0).plus(lockedInOrdersMap.get(this.nativeToken.address, DECIMAL_0)).plus(DECIMAL_0).plus(withdrawableMap.get(this.nativeToken.address, DECIMAL_0))
		};

		const totalBeacon: BaseBalance = {
			free: freeBalances.get(this.beaconToken.address, DECIMAL_0),
			lockedInOrders: lockedInOrdersMap.get(this.beaconToken.address, DECIMAL_0),
			lockedInPools: DECIMAL_0,
			withdrawable: withdrawableMap.get(this.beaconToken.address, DECIMAL_0),
			total: freeBalances.get(this.beaconToken.address, DECIMAL_0).plus(lockedInOrdersMap.get(this.beaconToken.address, DECIMAL_0)).plus(DECIMAL_0).plus(withdrawableMap.get(this.beaconToken.address, DECIMAL_0))
		};

		const balances: Balances = {
			tokens: tokensBalancesMap,
			total: {
				nativeToken: totalNative,
				beaconToken: totalBeacon
			}
		};

		return balances;
	}

	/**
	 * Get order
	 * @param request - The request object
	 * @returns The order response
	 */
	async getOrder(request: FinGetOrderRequest): Promise<FinGetOrderResponse> {
		let { ownerAddress, owner, marketAddress, marketSymbol, market, orderType, orderSide, orderStatus, orderPrice } = request;

		ownerAddress = this.getWalletAddress(ownerAddress, owner);
		marketAddress = marketAddress?.trim().toLowerCase() || undefined;
		marketSymbol = marketSymbol?.trim().toUpperCase() || undefined;
		orderType = OrderType[orderType?.trim().toUpperCase() as keyof typeof OrderType] || undefined;
		orderSide = OrderSide[orderSide?.trim().toUpperCase() as keyof typeof OrderSide] || undefined;
		orderStatus = OrderStatus[orderStatus?.trim().toUpperCase() as keyof typeof OrderStatus] || undefined;
		orderPrice = orderPrice || undefined;

		if (!ownerAddress && !owner) {
			throw new Error("Owner address or owner wallet is required, since it's used to compose the order ID.");
		}
		if (!marketAddress && !marketSymbol && !market) {
			throw new Error("Market address, market symbol, or market object is required");
		}

		if (!orderPrice) {
			throw new Error("Order price is required, since it's used to compose the order ID.");
		}

		if (!orderSide) {
			throw new Error("Order side is required, since it's used to compose the order ID.");
		}

		const orderId = `${ownerAddress}-${orderSide.toString().toLowerCase()}-${orderPrice.toString()}`;
		const orders = await this.getOrders({ ownerAddress, owner, marketAddress, marketSymbol, market, orderTypes: [orderType], orderSides: [orderSide], orderStatuses: [orderStatus], orderPrices: [orderPrice], maximumNumberOfOrders: 1 });
		const order = orders.get(orderId);

		if (!order) {
			throw new Error(`Order not found: ${orderId}`);
		}

		return order as FinGetOrderResponse;
	}

	/**
	 * Get orders
	 * @param request - The request object
	 * @returns The orders response
	 */
	async getOrders(request: FinGetOrdersRequest): Promise<FinGetOrdersResponse> {
		let { ownerAddress, owner, marketAddress, marketSymbol, market, orderTypes, orderSides, orderStatuses, orderPrices, orderIds, orders, maximumNumberOfOrders } = request;

		ownerAddress = this.getWalletAddress(ownerAddress, owner);
		marketAddress = marketAddress?.trim().toLowerCase() || undefined;
		marketSymbol = marketSymbol?.trim().toUpperCase() || undefined;
		orderTypes = MList(orderTypes?.map((orderType: OrderType) => OrderType[orderType?.trim().toUpperCase() as keyof typeof OrderType])) || undefined;
		orderSides = MList(orderSides?.map((orderSide: OrderSide) => OrderSide[orderSide?.trim().toUpperCase() as keyof typeof OrderSide])) || undefined;
		orderStatuses = MList(orderStatuses?.map((orderStatus: OrderStatus) => OrderStatus[orderStatus?.trim().toUpperCase() as keyof typeof OrderStatus])) || undefined;
		orderPrices = MList(orderPrices?.map((orderPrice: OrderPrice) => Decimal(orderPrice))) || undefined;
		maximumNumberOfOrders = maximumNumberOfOrders || Number(properties.getAs<string>('rujira.orders.maximumNumberOfOrders'));

		if (!ownerAddress && !owner) {
			throw new Error("Owner address is required");
		}
		if (!marketAddress && !marketSymbol && !market) {
			throw new Error("Market address or market symbol is required");
		}

		// Validate that at least one filtering criteria is provided when using orderIds or orders
		if ((orderIds && !List.isList(orderIds) ? orderIds.length > 0 : !orderIds?.isEmpty()) ||
			(orders && !List.isList(orders) ? orders.length > 0 : !orders?.isEmpty())) {
			if (!ownerAddress && !marketAddress && !marketSymbol && !market) {
				throw new Error("When filtering by orderIds or orders, at least one of ownerAddress, marketAddress, marketSymbol, or market must be provided");
			}
		}

		if (!market) {
			market = await this.getMarket({ address: marketAddress, symbol: marketSymbol });
		}

		// Sanitize orderIds and extract order IDs from orders objects
		const sanitizedOrderIds = MList<OrderId>();

		// Sanitize orderIds if provided
		if (orderIds && !List.isList(orderIds) ? orderIds.length > 0 : !orderIds?.isEmpty()) {
			const orderIdsList = List.isList(orderIds) ? orderIds : MList<OrderId>(orderIds);
			orderIdsList.forEach((orderId: OrderId) => {
				if (orderId && typeof orderId === 'string') {
					const sanitizedId = orderId.trim().toLowerCase();
					if (sanitizedId && !sanitizedOrderIds.includes(sanitizedId)) {
						sanitizedOrderIds.push(sanitizedId);
					}
				}
			});
		}

		// Sanitize orders by transforming into a list and extracting/sanitizing order IDs
		if (orders && !List.isList(orders) ? orders.length > 0 : !orders?.isEmpty()) {
			// Ensure orders is a List
			const ordersList = List.isList(orders) ? orders : MList<Order>(orders);

			// Extract and sanitize order IDs from order objects
			ordersList.forEach((orderObj: Order) => {
				if (orderObj && orderObj.id && typeof orderObj.id === 'string') {
					const sanitizedId = orderObj.id.trim().toLowerCase();
					if (sanitizedId && !sanitizedOrderIds.includes(sanitizedId)) {
						sanitizedOrderIds.push(sanitizedId);
					}
				}
			});
		}

		const query = {
			orders: {
				owner: ownerAddress,
				limit: maximumNumberOfOrders,
				offset: 0
			}
		} as {
			orders: {
				owner: string,
				limit: number,
				offset: number
			}
		};

		const result = await this.cosmClientQueryContractSmart(market.address, query);
		// Example response:
		// 	{
		// 		"owner": "thor1gsgx5xtw82r8qw06mrcxjzypuynqwjxcugk5fy",
		// 		"side": "quote",
		// 		"price": {
		// 			"fixed": "0.04"
		// 		},
		// 		"rate": "0.04",
		// 		"updated_at": "1753359648989354207",
		// 		"offer": "5400000",
		// 		"remaining": "5400000",
		// 		"filled": "0"
		// 	}
		const rawOrders = result.orders as [{
      owner: string,
      side: string,
      price: {
        fixed: string
      },
      rate: string,
      updated_at: string,
      offer: string,
      remaining: string,
      filled: string
    }] || [];

		let filteredOrders = MMap<OrderId, Order>();

		for (const rawOrder of rawOrders) {
			const type = OrderType.LIMIT;
			const side = rawOrder.side === 'quote' ? OrderSide.SELL : OrderSide.BUY;
			const price = new Decimal(rawOrder.price.fixed);
			const amount = new Decimal(rawOrder.offer);
			const filledAmount = new Decimal(rawOrder.filled);
			const filledPercentage = filledAmount.div(amount);
			const status = filledAmount.eq(DECIMAL_0) ? OrderStatus.OPEN : filledAmount.eq(amount) ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;

			const order = {
				id: `${ownerAddress}-${market.address}-${side.toString().toLowerCase()}-${price.toString()}`,
				market: market,
				ownerAddress: ownerAddress,
				type: type,
				side: side,
				price: price,
				amount: amount,
				filledAmount: filledAmount,
				filledPercentage: filledPercentage,
				status: status,
				raw: rawOrder
			} as Order;

			filteredOrders.set(getOrThrow<OrderId>(order.id), order);
		}

		filteredOrders = filteredOrders.filter((order: Order) => {
			// Filter by sanitized order IDs (merged from orderIds and orders)
			if (sanitizedOrderIds && !sanitizedOrderIds.isEmpty()) {
				if (!order.id || !sanitizedOrderIds.includes(order.id)) {
					return false;
				}
			}

			// Filter by owner address
			if (ownerAddress && order.ownerAddress !== ownerAddress) {
				return false;
			}

			// Filter by market address
			if (marketAddress && order.market.address !== marketAddress) {
				return false;
			}

			// Filter by market symbol
			if (marketSymbol && order.market.symbol !== marketSymbol) {
				return false;
			}

			// Filter by order types
			if (orderTypes && !orderTypes.isEmpty() && !orderTypes.includes(order.type)) {
				return false;
			}

			// Filter by order sides
			if (orderSides && !orderSides.isEmpty() && !orderSides.includes(order.side)) {
				return false;
			}

			// Filter by order statuses
			if (orderStatuses && !orderStatuses.isEmpty() && !orderStatuses.includes(order.status)) {
				return false;
			}

			// Filter by order prices
			if (orderPrices && !orderPrices.isEmpty() && (!order.price || !orderPrices.includes(getOrThrow<OrderPrice>(order.price)))) {
				return false;
			}

			return true;
		});

		if (maximumNumberOfOrders > 0) {
			filteredOrders = filteredOrders.slice(0, maximumNumberOfOrders);
		}

		return filteredOrders as FinGetOrdersResponse;
	}


	/**
	 * Place a single order (wrapper for createOrders)
	 * @param request - The request object
	 * @returns The response for the created order
	 */
	async placeOrder(request: FinPlaceOrderRequest): Promise<FinPlaceOrderResponse> {
		let { ownerAddress, owner, marketAddress, marketSymbol, market, side, type, amount, price } = request;

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			orders: {
				place: MList<FinPlaceOrderRequest>(
					[
						{
							ownerAddress,
							owner,
							marketAddress,
							marketSymbol,
							market,
							side, type, amount, price
						}
					]
				)
			}
		});

		const result = {
			order: getOrThrow<Order>(executedOrders.placedOrders?.first()),
			transaction: getOrThrow<Transaction>(executedOrders.transactions.first())
		}

		return result;
	}


	/**
	 * Place multiple orders
	 * @param request - The request object
	 * @returns The response for the created orders or null if failed
	 */
	async placeOrders(request: FinPlaceOrdersRequest): Promise<FinPlaceOrdersResponse> {
		let { ownerAddress, owner, orders } = request;

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			orders: {
				place: MList<FinPlaceOrderRequest>(orders)
			}
		});

		const result = {
			orders: getOrThrow<Map<OrderId, Order>>(executedOrders.placedOrders),
			transactions: executedOrders.transactions
		};

		return result;
	}

	/**
	 * Replace order
	 * @param request - The request object
	 * @returns The response for the replaced order
	 */
	async replaceOrder(request: FinReplaceOrderRequest): Promise<FinReplaceOrderResponse> {
		let { ownerAddress, owner, marketAddress, marketSymbol, market, side, type, amount, price } = request;

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			orders: {
				replace: MList<FinPlaceOrderRequest>([{
					ownerAddress,
					owner,
					marketAddress,
					marketSymbol,
					market,
					side,
					type,
					amount,
					price
				}])
			}
		});

		const result = {
			order: getOrThrow<Order>(executedOrders.replacedOrders?.first()),
			transaction: getOrThrow<Transaction>(executedOrders.transactions.first())
		}

		return result;
	}

	/**
	 * Replace multiple orders
	 * @param request - The request object
	 * @returns The response for the replaced orders
	 */
	async replaceOrders(request: FinReplaceOrdersRequest): Promise<FinReplaceOrdersResponse> {
		let { ownerAddress, owner, orders } = request;

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			orders: {
				replace: MList<FinPlaceOrderRequest>(orders)
			}
		});

		const result = {
			orders: getOrThrow<Map<OrderId, Order>>(executedOrders.replacedOrders),
			transactions: executedOrders.transactions
		};

		return result;
	}

	/**
	 * Cancel order (calls cancelOrders with a single orderId)
	 * @param request - The request object
	 * @returns The response for the canceled order
	 */
	async cancelOrder(request: FinCancelOrderRequest): Promise<FinCancelOrderResponse> {
		let { orderId, order, ownerAddress, owner, marketAddress, marketSymbol, market } = request;

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			marketAddress,
			marketSymbol,
			market,
			orders: {
				cancel: orderId ? MList<OrderId>([orderId]) : MList<Order>([getOrThrow<Order>(order)])
			}
		});

		const result = {
			order: getOrThrow<Order>(executedOrders.cancelledOrders?.first()),
			transaction: getOrThrow<Transaction>(executedOrders.transactions.first())
		}

		return result;
	}

	/**
	 * Cancel orders (only cancels the specified orderIds or orders)
	 * @param request - The request object
	 * @returns The response for the canceled orders
	 */
	async cancelOrders(request: FinCancelOrdersRequest): Promise<FinCancelOrdersResponse> {
		let { orderIds, orders, ownerAddress, owner, marketAddress, marketSymbol, market } = request;

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			marketAddress,
			marketSymbol,
			market,
			orders: {
				cancel: MList<OrderId>(orderIds) || MList<Order>(orders)
			}
		})

		const result = {
			orders: getOrThrow<Map<OrderId, Order>>(executedOrders.cancelledOrders),
			transactions: executedOrders.transactions
		};

		return result;
	}

	/**
	 * Cancel all orders for an owner in a market
	 * @param request - The request object
	 * @returns The response for the canceled orders
	 */
	async cancelAllOrders(request: FinCancelAllOrdersRequest): Promise<FinCancelAllOrdersResponse> {
		let { ownerAddress, owner, marketAddress, marketSymbol, market } = request;

		const allOpenOrders = await this.getOrders({
			ownerAddress,
			owner,
			marketAddress,
			marketSymbol,
			market,
			orderStatuses: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]
		});

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			marketAddress,
			marketSymbol,
			market,
			orders: {
				cancel: allOpenOrders.valueSeq().toList()
			}
		})

		const result = {
			orders: getOrThrow<Map<OrderId, Order>>(executedOrders.cancelledOrders),
			transactions: executedOrders.transactions
		};

		return result;
	}

	/**
	 * Withdraw from market (withdraw filled orders for a user in a market)
	 * @param request - The request object
	 * @returns The response for the withdrawn orders
	 */
	async withdrawFromMarket(request: FinWithdrawRequest): Promise<FinWithdrawResponse> {
		let { ownerAddress, owner, marketAddress, marketSymbol, market } = request;

		const allFilledOrders = await this.getOrders({
			ownerAddress,
			owner,
			marketAddress,
			marketSymbol,
			market,
			orderStatuses: [OrderStatus.FILLED]
		});

		const executedOrders = await this.executeOrders({
			ownerAddress,
			owner,
			marketAddress,
			marketSymbol,
			market,
			orders: {
				withdraw: allFilledOrders.valueSeq().toList()
			}
		});

		const result = {
			orders: getOrThrow<Map<OrderId, Order>>(executedOrders.withdrawnOrders),
			transactions: executedOrders.transactions
		};

		return result;
	}

	/**
	 * Fetch a resource
	 * @param input - The input to fetch
	 * @param init - The init to fetch
	 * @returns The response
	 */
	@runWithRetryAndTimeout()
	private async fetch(
		input: string | URL | globalThis.Request,
		init?: RequestInit,
	): Promise<Response> {
		return fetch(input, init);
	}

	/**
	 * Execute a message on the cosm client
	 * @param senderAddress - The address of the sender
	 * @param contractAddress - The address of the contract
	 * @param msg - The message to execute
	 * @param fee - The fee to pay
	 * @param memo - The memo to add to the transaction
	 * @param funds - The funds to transfer
	 * @returns The result of the execution
	 */
	@runWithRetryAndTimeout()
	private async cosmClientExecute(senderAddress: string, contractAddress: string, msg: JsonObject, fee: StdFee | "auto" | number, memo?: string, funds?: readonly Coin[]): Promise<ExecuteResult> {
		return this.cosmClient.execute(senderAddress, contractAddress, msg, fee, memo, funds);
	}

	/**
	 * Query a contract on the cosm client
	 * @param contractAddress - The address of the contract
	 * @param queryMsg - The query message
	 * @returns The result of the query
	 */
	@runWithRetryAndTimeout()
	private async cosmClientQueryContractSmart(contractAddress: string, queryMsg: JsonObject): Promise<JsonObject> {
		return this.cosmClient.queryContractSmart(contractAddress, queryMsg);
	}

	/**
	 * Get the height of the cosm client
	 * @returns The height
	 */
	@runWithRetryAndTimeout()
	private async cosmClientGetHeight(): Promise<number> {
		return this.cosmClient.getHeight();
	}

	/**
	 * Unified method to execute order operations (place, replace, cancel, withdraw)
	 * @param request - The unified request object
	 * @returns The unified response object
	 */
	async executeOrders(request: FinExecuteOrdersRequest): Promise<FinExecuteOrdersResponse> {
		let { ownerAddress, owner, marketAddress, marketSymbol, market, orders } = request;

		// ===== SANITIZATION =====
		ownerAddress = this.getWalletAddress(ownerAddress, owner);
		marketAddress = marketAddress?.trim().toLowerCase();
		marketSymbol = marketSymbol?.trim().toUpperCase();

		// Sanitize place orders
		if (orders.place) {
			orders.place = MList<FinPlaceOrderRequest>(orders.place.map((order: FinPlaceOrderRequest) => ({
				...order,
				ownerAddress: this.getWalletAddress(order.ownerAddress, order.owner),
				marketAddress: order.marketAddress?.trim().toLowerCase(),
				marketSymbol: order.marketSymbol?.trim().toUpperCase(),
				side: OrderSide[order.side?.trim().toUpperCase() as keyof typeof OrderSide] || undefined,
				type: OrderType[order.type?.trim().toUpperCase() as keyof typeof OrderType] || undefined,
				amount: Decimal(order.amount),
				price: order.price ? Decimal(order.price) : undefined,
			})));
		}

		// Sanitize replace orders
		if (orders.replace) {
			orders.replace = MList<FinReplaceOrderRequest>(orders.replace.map((order: FinReplaceOrderRequest) => ({
				...order,
				ownerAddress: this.getWalletAddress(order.ownerAddress, order.owner),
				marketAddress: order.marketAddress?.trim().toLowerCase(),
				marketSymbol: order.marketSymbol?.trim().toUpperCase(),
				side: OrderSide[order.side?.trim().toUpperCase() as keyof typeof OrderSide] || undefined,
				type: OrderType[order.type?.trim().toUpperCase() as keyof typeof OrderType] || undefined,
				amount: Decimal(order.amount),
				price: order.price ? Decimal(order.price) : undefined,
			})));
		}

		// Sanitize cancel orders
		if (orders.cancel) {
			const cancelOrderIds = MList<OrderId>();
			orders.cancel.forEach((item: OrderId | Order) => {
				if (typeof item === 'string') {
					cancelOrderIds.push(item.trim().toLowerCase());
				} else if (item.id) {
					cancelOrderIds.push(item.id.trim().toLowerCase());
				}
			});
			orders.cancel = cancelOrderIds;
		}

		// Sanitize withdraw orders
		if (orders.withdraw) {
			const withdrawOrderIds = MList<OrderId>();
			orders.withdraw.forEach((item: OrderId | Order) => {
				if (typeof item === 'string') {
					withdrawOrderIds.push(item.trim().toLowerCase());
				} else if (item.id) {
					withdrawOrderIds.push(item.id.trim().toLowerCase());
				}
			});
			orders.withdraw = withdrawOrderIds;
		}

		// ===== VALIDATION =====
		if (!ownerAddress) {
			throw new Error("Owner address or owner wallet is required");
		}

		if (!marketAddress && !marketSymbol && !market) {
			throw new Error("Market address, market symbol, or market object is required");
		}

		// Validate that all orders use the same market
		const validateMarket = (orders: any[], operation: string) => {
			if (orders && orders.length > 0) {
				orders.forEach((order: any) => {
					if (order.marketAddress && order.marketAddress !== marketAddress) {
						throw new Error(`${operation} orders must use the same market. Expected: ${marketAddress}, Got: ${order.marketAddress}`);
					}
					if (order.marketSymbol && order.marketSymbol !== marketSymbol) {
						throw new Error(`${operation} orders must use the same market. Expected: ${marketSymbol}, Got: ${order.marketSymbol}`);
					}
				});
			}
		};

		validateMarket(orders.place?.toArray() || [], 'Place');
		validateMarket(orders.replace?.toArray() || [], 'Replace');

		if (!market) {
			market = await this.getMarket({ address: marketAddress, symbol: marketSymbol });
		}

		// Validate place orders
		if (orders.place) {
			orders.place.forEach((order: FinPlaceOrderRequest) => {
				if (!order.side || !order.type || !order.amount) {
					throw new Error("Order side, type, and amount are required for place orders");
				}
				if (order.type === OrderType.LIMIT && !order.price) {
					throw new Error("Order price is required for limit place orders");
				}
			});
		}

		// Validate replace orders
		if (orders.replace) {
			orders.replace.forEach((order: FinReplaceOrderRequest) => {
				if (!order.side || !order.type || !order.amount) {
					throw new Error("Order side, type, and amount are required for replace orders");
				}
				if (order.type === OrderType.LIMIT && !order.price) {
					throw new Error("Order price is required for limit replace orders");
				}
			});
		}

		// Validate cancel orders
		if (orders.cancel) {
			if (orders.cancel.isEmpty()) {
				throw new Error("Valid order IDs are required for cancellation");
			}
		}

		// Validate withdraw orders
		if (orders.withdraw) {
			if (orders.withdraw.isEmpty()) {
				throw new Error("Valid order IDs are required for withdrawal");
			}
		}

		// ===== INITIALIZATION =====
		const contractAddress = market.address;
		const transactions = MMap<TransactionHash, Transaction>();
		const ordersMap = MMap<string, Map<OrderId, Order>>();

		// Get existing orders to check their status (open, partially filled, filled orders)
		const existingOrders = await this.getOrders({
			ownerAddress,
			market,
			orderTypes: [OrderType.LIMIT],
			orderStatuses: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED, OrderStatus.FILLED]
		});

		// Build the complete order message structure
		const executeMessages: any[] = [];

		// Process place orders
		if (orders.place && !orders.place.isEmpty()) {
			const placeOrdersMap = MMap<OrderId, Order>();

			orders.place.forEach((order: FinPlaceOrderRequest) => {
				const orderId = `${ownerAddress}-${order.side.toString().toLowerCase()}-${order.price?.toString()}`;

				// Create message
				const side = order.side === OrderSide.BUY ? 'quote' : 'base';
				const price = order.price?.toString() || '0';
				const amount = order.amount.mul(10 ** (order.side === OrderSide.BUY ? market.tokens.quote.decimals : market.tokens.base.decimals)).toString();

				executeMessages.push([side, { fixed: price }, amount]);

				// Create a proper Order object at this moment
				const orderObject: Order = {
					id: orderId,
					market: market,
					ownerAddress: ownerAddress,
					type: order.type,
					side: order.side,
					price: order.price,
					amount: order.amount,
					filledAmount: DECIMAL_0,
					filledPercentage: DECIMAL_0,
					status: OrderStatus.OPEN,
					creationTimestamp: Date.now(),
					updateTimestamp: Date.now(),
					raw: order
				};
				placeOrdersMap.set(orderId, orderObject);
			});
			ordersMap.set('place', placeOrdersMap);
		}

		// Process replace orders
		if (orders.replace && !orders.replace.isEmpty()) {
			const replaceOrdersMap = MMap<OrderId, Order>();

			orders.replace.forEach((order: FinReplaceOrderRequest) => {
				const orderId = `${ownerAddress}-${order.side.toString().toLowerCase()}-${order.price?.toString()}`;

				// Create message
				const side = order.side === OrderSide.BUY ? 'quote' : 'base';
				const price = order.price?.toString() || '0';
				const amount = order.amount.mul(10 ** (order.side === OrderSide.BUY ? market.tokens.quote.decimals : market.tokens.base.decimals)).toString();

				executeMessages.push([side, { fixed: price }, amount]);

				// Create a proper Order object using existing order and new amount
				const orderObject: Order = {
					id: orderId,
					market: market,
					ownerAddress: ownerAddress,
					type: order.type,
					side: order.side,
					price: order.price,
					amount: order.amount,
					filledAmount: DECIMAL_0,
					filledPercentage: DECIMAL_0,
					status: OrderStatus.OPEN,
					creationTimestamp: Date.now(),
					updateTimestamp: Date.now(),
					raw: order
				};
				replaceOrdersMap.set(orderId, orderObject);
			});
			ordersMap.set('replace', replaceOrdersMap);
		}

		// Process cancel orders
		if (orders.cancel && !orders.cancel.isEmpty()) {
			const cancelOrdersMap = MMap<OrderId, Order>();

			orders.cancel.forEach((orderId: OrderId) => {
				// Check if order exists in existing orders
				const existingOrder = existingOrders.get(orderId);
				if (!existingOrder) {
					throw new Error(`Order not found: ${orderId}`);
				}

				// Validate order status for cancellation
				if (existingOrder.status !== OrderStatus.OPEN) {
					throw new Error(`Cannot cancel order ${orderId}: status is ${existingOrder.status}, must be ${OrderStatus.OPEN}`);
				}

				// Create cancel message: [side, { fixed: price }, '0']
				const side = existingOrder.side === OrderSide.BUY ? 'quote' : 'base';
				const price = existingOrder.price?.toString() || '0';

				executeMessages.push([side, { fixed: price }, '0']);

				// Update order status to CANCELLED and update timestamp
				const cancelledOrder: Order = {
					...existingOrder,
					status: OrderStatus.CANCELLED,
					updateTimestamp: Date.now()
				};
				cancelOrdersMap.set(orderId, cancelledOrder);
			});
			ordersMap.set('cancel', cancelOrdersMap);
		}

		// Process withdraw orders
		if (orders.withdraw && !orders.withdraw.isEmpty()) {
			const withdrawOrdersMap = MMap<OrderId, Order>();

			orders.withdraw.forEach((orderId: OrderId) => {
				// Check if order exists in existing orders
				const existingOrder = existingOrders.get(orderId);
				if (!existingOrder) {
					throw new Error(`Order not found: ${orderId}`);
				}

				// Validate order status for withdrawal
				if (existingOrder.status !== OrderStatus.FILLED) {
					throw new Error(`Cannot withdraw order ${orderId}: status is ${existingOrder.status}, must be ${OrderStatus.FILLED}`);
				}

				// For withdraw, we use the same structure as place/replace but with null amount
				const side = existingOrder.side === OrderSide.BUY ? 'quote' : 'base';
				const price = existingOrder.price?.toString() || '0';

				executeMessages.push([side, { fixed: price }, null]);

				// Update timestamp for withdrawn order
				const withdrawnOrder: Order = {
					...existingOrder,
					updateTimestamp: Date.now()
				};
				withdrawOrdersMap.set(orderId, withdrawnOrder);
			});
			ordersMap.set('withdraw', withdrawOrdersMap);
		}

		if (executeMessages.length === 0) {
			throw new Error("No valid orders to execute");
		}

		// Execute the transaction
		const response = await this.cosmClient.execute(
			ownerAddress,
			contractAddress,
			{
				order: [executeMessages, null]
			},
			'auto'
		);

		// Get the transaction details
		const transaction = await this.getTransaction({ hash: response.transactionHash });
		transactions.set(transaction.hash, transaction);

		// Build the response
		const result: FinExecuteOrdersResponse = {
			placedOrders: ordersMap.get('place'),
			replacedOrders: ordersMap.get('replace'),
			cancelledOrders: ordersMap.get('cancel'),
			withdrawnOrders: ordersMap.get('withdraw'),
			transactions: transactions
		};

		return result;
	}
}

/**
 * Ignore an exception
 * @param exception - The exception to ignore
 */
const ignoreException = (exception: any): void => {
	let message = 'Ignored exception: ';
	if (exception instanceof Error) {
		message += exception.message;
	} else {
		message += exception;
	}

	console.warn(message);
};
