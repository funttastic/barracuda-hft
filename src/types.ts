// noinspection JSUnusedGlobalSymbols

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { AccountData, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import Decimal from 'decimal.js';
import BN from "bn.js";
import { GasPrice } from '@cosmjs/stargate';
import { properties } from './properties';
import { List, Map } from 'immutable';
import { MList, MMap } from './extensions/immutablejs/types';

export { List, Map, MList, MMap };

export const DECIMAL_0 = new Decimal(0);
export const DECIMAL_1 = new Decimal(1);
export const DECIMAL_10 = new Decimal(10);
export const DECIMAL_100 = new Decimal(100);
export const DECIMAL_INFINITY = new Decimal(Number.POSITIVE_INFINITY);
export const DECIMAL_NEGATIVE_INFINITY = new Decimal(Number.NEGATIVE_INFINITY);
export const DECIMAL_NaN = new Decimal(NaN);
export const BIG_NUMBER_0 = new BN(0);
export const BIG_NUMBER_1 = new BN(1);
export const BIG_NUMBER_10 = new BN(10);
export const BIG_NUMBER_100 = new BN(100);
export const BIG_NUMBER_NaN = new BN(NaN);

properties.set('wallet.prefix', 'thor');

export enum Chain {
	ETHEREUM = 'ethereum',
	RUJIRA = 'rujira',
	THORCHAIN = 'thorchain',
}

export enum SystemStatus {
	UP = 'up',
	DOWN = 'down',
}

export enum Network {
	MAINNET = 'mainnet',
	TESTNET = 'testnet'
}

export enum TransactionStatus {
	PENDING = 'pending',
	SUCCESS = 'success',
	FAILED = 'failed'
}

export enum MarketStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive'
}

export enum OrderSide {
	BUY = 'buy',
	SELL = 'sell'
}

export enum OrderType {
	MARKET = 'market',
	LIMIT = 'limit'
}

export enum OrderStatus {
	OPEN = 'open',
	CANCELLED = 'cancelled',
	PARTIALLY_FILLED = 'partially_filled',
	FILLED = 'filled',
	CREATION_PENDING = 'creation_pending',
	CANCELLATION_PENDING = 'cancellation_pending',
	UNKNOWN = 'unknown'
}

/**
 * Represents an indicator
 */
export class Indicator {
	static accumulation_distribution_line = new Indicator("ad", "Accumulation/Distribution Line", []);
	static adosc = new Indicator("adosc", "Accumulation/Distribution Oscillator", []);
	static adx = new Indicator("adx", "Average Directional Movement Index", []);
	static adxr = new Indicator("adxr", "Average Directional Movement Rating", []);
	static ao = new Indicator("ao", "Awesome Oscillator", []);
	static apo = new Indicator("apo", "Absolute Price Oscillator", []);
	static aroon = new Indicator("aroon", "Aroon", []);
	static aroonosc = new Indicator("aroonosc", "Aroon Oscillator", []);
	static atr = new Indicator("atr", "Average True Range", []);
	static avgprice = new Indicator("avgprice", "Average Price", []);
	static bbands = new Indicator("bbands", "Bollinger Bands", [20, 2]);
	static bop = new Indicator("bop", "Balance of Power", []);
	static cci = new Indicator("cci", "Commodity Channel Index", []);
	static cmo = new Indicator("cmo", "Chande Momentum Oscillator", []);
	static crossany = new Indicator("crossany", "Crossany", []);
	static crossover = new Indicator("crossover", "Crossover", []);
	static crossunder = new Indicator("crossunder", "Crossunder", []);
	static crossOverNumber = new Indicator("crossOverNumber", "Crossover a number", []);
	static crossUnderNumber = new Indicator("crossUnderNumber", "Crossunder a number", []);
	static cvi = new Indicator("cvi", "Chaikins Volatility", []);
	static decay = new Indicator("decay", "Linear Decay", []);
	static dema = new Indicator("dema", "Double Exponential Moving Average", []);
	static di = new Indicator("di", "Directional Indicator", []);
	static dm = new Indicator("dm", "Directional Movement", []);
	static dpo = new Indicator("dpo", "Detrended Price Oscillator", []);
	static dx = new Indicator("dx", "Directional Movement Index", []);
	static edecay = new Indicator("edecay", "Exponential Decay", []);
	static ema = new Indicator("ema", "Exponential Moving Average", []);
	static emv = new Indicator("emv", "Ease of Movement", []);
	static fisher = new Indicator("fisher", "Fisher Transform", []);
	static fosc = new Indicator("fosc", "Forecast Oscillator", []);
	static hma = new Indicator("hma", "Hull Moving Average", []);
	static kama = new Indicator("kama", "Kaufman Adaptive Moving Average", []);
	static kvo = new Indicator("kvo", "Klinger Volume Oscillator", []);
	static lag = new Indicator("lag", "Lag", []);
	static linreg = new Indicator("linreg", "Linear Regression", []);
	static linregintercept = new Indicator("linregintercept", "Linear Regression Intercept", []);
	static linregslope = new Indicator("linregslope", "Linear Regression Slope", []);
	static macd = new Indicator("macd", "Moving Average Convergence/Divergence", []);
	static marketfi = new Indicator("marketfi", "Market Facilitation Index", []);
	static mass = new Indicator("mass", "Mass Index", []);
	static max = new Indicator("max", "Maximum In Period", []);
	static md = new Indicator("md", "Mean Deviation Over Period", []);
	static medprice = new Indicator("medprice", "Median Price", []);
	static mfi = new Indicator("mfi", "Money Flow Index", []);
	static min = new Indicator("min", "Minimum In Period", []);
	static mom = new Indicator("mom", "Momentum", []);
	static natr = new Indicator("natr", "Normalized Average True Range", []);
	static nvi = new Indicator("nvi", "Negative Volume Index", []);
	static obv = new Indicator("obv", "On Balance Volume", []);
	static ppo = new Indicator("ppo", "Percentage Price Oscillator", []);
	static psar = new Indicator("psar", "Parabolic SAR", []);
	static pvi = new Indicator("pvi", "Positive Volume Index", []);
	static qstick = new Indicator("qstick", "Qstick", []);
	static roc = new Indicator("roc", "Rate of Change", []);
	static rocr = new Indicator("rocr", "Rate of Change Ratio", []);
	static rsi = new Indicator("rsi", "Relative Strength Index", []);
	static sma = new Indicator("sma", "Simple Moving Average", []);
	static stddev = new Indicator("stddev", "Standard Deviation Over Period", []);
	static stderr = new Indicator("stderr", "Standard Error Over Period", []);
	static stoch = new Indicator("stoch", "Stochastic Oscillator", []);
	static stochrsi = new Indicator("stochrsi", "Stochastic RSI", []);
	static sum = new Indicator("sum", "Sum Over Period", []);
	static tema = new Indicator("tema", "Triple Exponential Moving Average", []);
	static tr = new Indicator("tr", "True Range", []);
	static trima = new Indicator("trima", "Triangular Moving Average", []);
	static trix = new Indicator("trix", "Trix", []);
	static tsf = new Indicator("tsf", "Time Series Forecast", []);
	static typprice = new Indicator("typprice", "Typical Price", []);
	static ultosc = new Indicator("ultosc", "Ultimate Oscillator", []);
	static var = new Indicator("var", "Variance Over Period", []);
	static vhf = new Indicator("vhf", "Vertical Horizontal Filter", []);
	static vidya = new Indicator("vidya", "Variable Index Dynamic Average", []);
	static volatility = new Indicator("volatility", "Annualized Historical Volatility", []);
	static vosc = new Indicator("vosc", "Volume Oscillator", []);
	static vwma = new Indicator("vwma", "Volume Weighted Moving Average", []);
	static wad = new Indicator("wad", "Williams Accumulation/Distribution", []);
	static wcprice = new Indicator("wcprice", "Weighted Close Price", []);
	static wilders = new Indicator("wilders", "Wilders Smoothing", []);
	static willr = new Indicator("willr", "Williams %R", []);
	static wma = new Indicator("wma", "Weighted Moving Average", []);
	static zlema = new Indicator("zlema", "Zero-Lag Exponential Moving Average", []);
	static abands = new Indicator("abands", "?", []);
	static alma = new Indicator("alma", "Arnaud Legoux Moving Average", []);
	static ce = new Indicator("ce", "Chandelier Exit", []);
	static cmf = new Indicator("cmf", "Chaikin money flow", []);
	static dc = new Indicator("dc", "Donchian Channels", []);
	static fi = new Indicator("fi", "Force index", []);
	static kc = new Indicator("kc", "Keltner Channels", []);
	static kst = new Indicator("kst", "Know Sure Thing", []);
	static pbands = new Indicator("pbands", "?", []);
	static pfe = new Indicator("pfe", "Polarized Fractal Efficiency", []);
	static posc = new Indicator("posc", "?", []);
	static rmi = new Indicator("rmi", "Relative Momentum Index", []);
	static rmta = new Indicator("rmta", "Recursive Moving Trend Average", []);
	static rvi = new Indicator("rvi", "Relative Vigor Index", []);
	static smi = new Indicator("smi", "Stochastic Momentum Index", []);
	static tsi = new Indicator("tsi", "True Strength Index", []);
	static vwap = new Indicator("vwap", "Volume-Weighted Average Price", []);

	/**
	 * ID of the indicator
	 */
	id: IndicatorId;

	/**
	 * Name of the indicator
	 */
	name: IndicatorName;

	/**
	 * Default parameters of the indicator
	 */
	defaultParameters: IndicatorParameters;

	/**
	 *
	 * @param id
	 * @param name
	 * @param defaultParameters
	 */
	constructor(id: string, name: string, defaultParameters: IndicatorParameters) {
		this.id = id;
		this.name = name;
		this.defaultParameters = defaultParameters;
	}

	/**
	 * Get all indicators
	 * @returns All indicators
	 */
	static getAll(): Indicator[] {
		return [
			Indicator.accumulation_distribution_line,
			Indicator.adosc,
			Indicator.adx,
			Indicator.adxr,
			Indicator.ao,
			Indicator.apo,
			Indicator.aroon,
			Indicator.aroonosc,
			Indicator.atr,
			Indicator.avgprice,
			Indicator.bbands,
			Indicator.bop,
			Indicator.cci,
			Indicator.cmo,
			Indicator.crossany,
			Indicator.crossover,
			Indicator.crossunder,
			Indicator.crossOverNumber,
			Indicator.crossUnderNumber,
			Indicator.cvi,
			Indicator.decay,
			Indicator.dema,
			Indicator.di,
			Indicator.dm,
			Indicator.dpo,
			Indicator.dx,
			Indicator.edecay,
			Indicator.ema,
			Indicator.emv,
			Indicator.fisher,
			Indicator.fosc,
			Indicator.hma,
			Indicator.kama,
			Indicator.kvo,
			Indicator.lag,
			Indicator.linreg,
			Indicator.linregintercept,
			Indicator.linregslope,
			Indicator.macd,
			Indicator.marketfi,
			Indicator.mass,
			Indicator.max,
			Indicator.md,
			Indicator.medprice,
			Indicator.mfi,
			Indicator.min,
			Indicator.mom,
			Indicator.natr,
			Indicator.nvi,
			Indicator.obv,
			Indicator.ppo,
			Indicator.psar,
			Indicator.pvi,
			Indicator.qstick,
			Indicator.roc,
			Indicator.rocr,
			Indicator.rsi,
			Indicator.sma,
			Indicator.stddev,
			Indicator.stderr,
			Indicator.stoch,
			Indicator.stochrsi,
			Indicator.sum,
			Indicator.tema,
			Indicator.tr,
			Indicator.trima,
			Indicator.trix,
			Indicator.tsf,
			Indicator.typprice,
			Indicator.ultosc,
			Indicator.var,
			Indicator.vhf,
			Indicator.vidya,
			Indicator.volatility,
			Indicator.vosc,
			Indicator.vwma,
			Indicator.wad,
			Indicator.wcprice,
			Indicator.wilders,
			Indicator.willr,
			Indicator.wma,
			Indicator.zlema,
			Indicator.abands,
			Indicator.alma,
			Indicator.ce,
			Indicator.cmf,
			Indicator.dc,
			Indicator.fi,
			Indicator.kc,
			Indicator.kst,
			Indicator.pbands,
			Indicator.pfe,
			Indicator.posc,
			Indicator.rmi,
			Indicator.rmta,
			Indicator.rvi,
			Indicator.smi,
			Indicator.tsi,
			Indicator.vwap,
		];
	}
}

export type Boolean = boolean;
export type Raw = any;
export type Id = string;
export type Address = string;
export type Symbol = string;
export type Name = string;
export type Mnemonic = string;
export type PrivateKey = string;
export type Integer = number;
export type Amount = Decimal;
export type Percentage = Decimal;
export type Hash = string;
export type Timestamp = number;
export type URL = string;
export type ErrorMessage = string;

export type WalletAddress = Address;
export type WalletMnemonic = Mnemonic;
export type WalletPrivateKey = PrivateKey;

export type TokenAddress = Address;
export type TokenSymbol = Symbol;
export type TokenName = Name;
export type TokenDecimals = Integer;

export type FeeAmount = Amount;
export type FeeToken = Token;

export type TransactionHash = Hash;

export type MarketAddress = Address;
export type MarketSymbol = Symbol;
export type MarketDecimals = Integer;
export type MarketPrice = Amount;

export type OrderBookOrderPrice = Amount;
export type OrderBookOrderAmount = Amount;
export type OrderBookPrice = Amount;

export type TickerPrice = Amount;
export type TickerTimestamp = Timestamp;

export type CandleTimestamp = Timestamp;
export type CandlePrice = Amount;
export type CandleVolume = Amount;
export type CandleInterval = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M' | '1y';

export type IndicatorId = Id;
export type IndicatorName = Name;
export type IndicatorParameters = any[];
export type IndicatorValue = any;

export type OrderId = Id;
export type OrderPrice = Amount;
export type OrderAmount = Amount;
export type OrderFilledAmount = Amount;
export type OrderFilledPercentage = Percentage;
export type OrderCreationTimestamp = Timestamp;
export type OrderUpdateTimestamp = Timestamp;

export type Wallet = {
	cosmWallet: DirectSecp256k1Wallet;
	firstAccount: AccountData;
};

/**
 * Represents a token
 */
export interface Token {
	/**
	 * Address of the token
	 */
	address: TokenAddress;

	/**
	 * Symbol of the token
	 */
	symbol: TokenSymbol;

	/**
	 * Name of the token
	 */
	name: TokenName;

	/**
	 * Number of decimal places
	 */
	decimals: TokenDecimals;

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Represents a transaction
 */
export interface Transaction {
	/**
	 * Hash of the transaction
	 */
	hash: TransactionHash;

	/**
	 * Status of the transaction
	 */
	status: TransactionStatus;

	/**
	 * Fee of the transaction
	 */
	fee: {
		/**
		 * Amount of the fee
		 */
		amount: FeeAmount;

		/**
		 * Token of the fee
		 */
		token: FeeToken;
	};

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Represents a market
 */
export interface Market {
	/**
	 * Address of the market
	 */
	address: MarketAddress;

	/**
	 * Symbol of the market
	 */
	symbol: MarketSymbol;

	/**
	 * Tokens of the market
	 */
	tokens: {
		/**
		 * Base token of the market
		 */
		base: Token;

		/**
		 * Quote token of the market
		 */
		quote: Token;
	};

	/**
	 * Number of decimal places
	 */
	decimals: MarketDecimals;

	/**
	 * Status of the market
	 */
	status: MarketStatus;

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Represents an order book order
 */
export interface OrderBookOrder {
	/**
	 * Price of the order
	 */
	price: OrderBookOrderPrice;

	/**
	 * Amount of the order
	 */
	amount: OrderBookOrderAmount;

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Represents an order book
 */
export interface OrderBook {
	/**
	 * Market of the order book
	 */
	market: Market;

	/**
	 * Book of the order book
	 */
	book: {
		/**
		 * Bids of the order book
		 */
		bids: List<OrderBookOrder>;

		/**
		 * Asks of the order book
		 */
		asks: List<OrderBookOrder>;

		/**
		 * Best bid of the order book
		 */
		bestBid?: OrderBookOrder;

		/**
		 * Best ask of the order book
		 */
		bestAsk?: OrderBookOrder;
	}

	/**
	 * Prices of the order book
	 */
	statistics: {
		/**
		 * Middle price of the order book
		 */
		middlePrice: {
			/**
			 * Price of the base token to the quote token
			 */
			baseToQuote?: OrderBookPrice;

			/**
			 * Price of the quote token to the base token
			 */
			quoteToBase?: OrderBookPrice;
		},

		/**
		 * Volume weighted average price (VWAP) of the order book
		 */
		volumeWeightedAveragePrice: {
			/**
			 * Price of the base token to the quote token
			 */
			baseToQuote?: OrderBookPrice;

			/**
			 * Price of the quote token to the base token
			 */
			quoteToBase?: OrderBookPrice;
		}
	}

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Represents a ticker
 */
export interface Ticker {
	/**
	 * Market of the ticker
	 */
	market: Market;

	/**
	 * Price of the ticker
	 */
	middlePrice?: TickerPrice;

	/**
	 * Volume weighted average price (VWAP) of the ticker
	 */
	volumeWeightedAveragePrice?: TickerPrice;

	/**
	 * Timestamp of the ticker
	 */
	timestamp: TickerTimestamp;

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Represents a candle
 */
export interface Candle {
	/**
	 * Timestamp of the candle
	 */
	timestamp: CandleTimestamp;

	/**
	 * Open price of the candle
	 */
	open: CandlePrice;

	/**
	 * High price of the candle
	 */
	high: CandlePrice;

	/**
	 * Low price of the candle
	 */
	low: CandlePrice;

	/**
	 * Close price of the candle
	 */
	close: CandlePrice;

	/**
	 * Volume of the candle
	 */
	volume: CandleVolume;

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Represents an indicator
 */
export interface IndicatorData {
	/**
	 * ID of the indicator
	 */
	indicator: Indicator;

	/**
	 * Value of the indicator
	 */
	value: IndicatorValue;
}


/**
 * Represents a balance of a token
 */
export interface BaseBalance {
	/**
	 * Free balance of the token
	 */
	free: Amount;

	/**
	 * Locked in orders balance of the token
	 */
	lockedInOrders: Amount;

	/**
	 * Locked in pools balance of the token
	 */
	lockedInPools: Amount;

	/**
	 * Withdrawable balance of the token
	 */
	withdrawable: Amount;

	/**
	 * Total balance of the token
	 */
	total: Amount;
}

/**
 * Represents a balance of a token with a quotation
 */
export interface BaseBalanceWithQuotation extends BaseBalance {
	/**
	 * Quotation of the token
	 */
	quotation: {
		/**
		 * Token of the quotation
		 */
		token: Token;

		/**
		 * Conversion rate of the token
		 */
		tokenToQuote: Amount;

		/**
		 * Conversion rate of the quote
		 */
		quoteToToken: Amount;
	};
}

/**
 * Represents a balance of a token
 */
export interface BaseTokenBalance {
	/**
	 * Balance of the token
	 */
	token: BaseBalance;

	/**
	 * Balance of the native token
	 */
	nativeToken: BaseBalanceWithQuotation;

	/**
	 * Balance of the beacon token
	 */
	beaconToken: BaseBalanceWithQuotation;
}

/**
 * Represents a balance of a token
 */
export interface TokenBalance {
	/**
	 * Token of the balance
	 */
	token: Token;

	/**
	 * Balances of the token
	 */
	balances: BaseTokenBalance;
}

/**
 * Represents a total balance of a token
 */
export interface TotalBalances {
	/**
	 * Balance of the native token
	 */
	nativeToken: BaseBalance;

	/**
	 * Balance of the beacon token
	 */
	beaconToken: BaseBalance;
}

/**
 * Represents a balance of a token
 */
export interface Balances {
	/**
	 * Balances of the tokens
	 */
	tokens: Map<TokenAddress, TokenBalance>;

	/**
	 * Total balances of the wallet
	 */
	total: TotalBalances;
}

/**
 * Represents an order
 */
export interface Order {
	/**
	 * ID of the order
	 */
	id?: OrderId;

	/**
	 * Market of the order
	 */
	market: Market;

	/**
	 * The account which placed the order
	 */
	ownerAddress: WalletAddress;

	/**
	 * Type of the order
	 */
	type: OrderType;

	/**
	 * The side of the order
	 */
	side: OrderSide;

	/**
	 * Price of the order
	 */
	price?: OrderPrice;

	/**
	 * Amount of the order
	 */
	amount: OrderAmount;

	/**
	 * Amount of filled order awaiting withdrawal
	 */
	filledAmount: OrderFilledAmount;

	/**
	 * Filled percentage of the order
	 */
	filledPercentage: OrderFilledPercentage;

	/**
	 * Status of the order
	 */
	status: OrderStatus;

	/**
	 * Timestamp of the order
	 */
	creationTimestamp?: OrderCreationTimestamp;

	/**
	 * Update timestamp of the order
	 */
	updateTimestamp?: OrderUpdateTimestamp;

	/**
	 * Raw data
	 */
	raw: Raw;
}

/**
 * Rujira constructor options
 */
export interface RujiraConstructorOptions {
	/**
	 * Wallet mnemonic
	 */
	walletMnemonic?: WalletMnemonic;

	/**
	 * Wallet private key
	 */
	walletPrivateKey?: WalletPrivateKey;
}

/**
 * Rujira initialize options
 */
export interface RujiraInitializeOptions {
}

/**
 * Fin constructor options
 */
export interface FinConstructorOptions {
}

/**
 * Fin initialize options
 */
export interface FinInitializeOptions {
	/**
	 * Wallet
	 */
	wallet: Wallet;

	/**
	 * Wallet address
	 */
	walletAddress: WalletAddress;

	/**
	 * Cosm client
	 */
	cosmClient: SigningCosmWasmClient;
}

/**
 * Get status request
 */
export interface FinGetStatusRequest {
}

/**
 * Get status response
 */
export interface FinGetStatusResponse {
	/**
	 * System status
	 */
	status: SystemStatus;

	/**
	 * Error message (only present when status is DOWN)
	 */
	error?: ErrorMessage;
}

/**
 * Get token request
 */
export interface FinGetTokenRequest {
	/**
	 * Token address
	 */
	address?: TokenAddress;

	/**
	 * Token symbol
	 */
	symbol?: TokenSymbol;
}

/**
 * Get token response
 */
export interface FinGetTokenResponse extends Token {
}

/**
 * Get tokens request (if no addresses or symbols are provided, all tokens will be returned)
 */
export interface FinGetTokensRequest {
	/**
	 * Token addresses
	 */
	addresses?: List<TokenAddress> | TokenAddress[];

	/**
	 * Token symbols
	 */
	symbols?: List<TokenSymbol> | TokenSymbol[];
}

/**
 * Get tokens response
 */
export interface FinGetTokensResponse extends Map<TokenAddress, Token> {
}

/**
 * Get all tokens request
 */
export interface FinGetAllTokensRequest {
}

/**
 * Get all tokens response
 */
export interface FinGetAllTokensResponse extends Map<TokenAddress, Token> {
}

/**
 * Get market request
 */
export interface FinGetMarketRequest {
	/**
	 * Market address
	 */
	address?: MarketAddress;

	/**
	 * Market name
	 */
	symbol?: MarketSymbol;
}

/**
 * Get market response
 */
export interface FinGetMarketResponse extends Market {
}

/**
 * Get markets request
 */
export interface FinGetMarketsRequest {
	/**
	 * Market address
	 */
	addresses?: List<MarketAddress> | MarketAddress[];

	/**
	 * Market name
	 */
	symbols?: List<MarketSymbol> | MarketSymbol[];
}

/**
 * Get markets response
 */
export interface FinGetMarketsResponse extends Map<MarketAddress, Market> {
}

/**
 * Get all markets request
 */
export interface FinGetAllMarketsRequest {
}

/**
 * Get all markets response
 */
export interface FinGetAllMarketsResponse extends Map<MarketAddress, Market> {
}

/**
 * Get order book request
 */
export interface FinGetOrderBookRequest {
	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;

	/**
	 * Maximum number of orders to return
	 */
	maximumNumberOfOrders?: Integer;
}

/**
 * Get order book response
 */
export interface FinGetOrderBookResponse extends OrderBook {
}

/**
 * Get ticker request
 */
export interface FinGetTickerRequest {
	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;
}

/**
 * Get ticker response
 */
export interface FinGetTickerResponse extends Ticker {
}

/**
 * Get candles request
 */
export interface FinGetCandlesRequest {
	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

		/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;

	/**
	 * Maximum number of candles to return
	 */
	maximumNumberOfCandles?: Integer;

	/**
	 * Candle interval
	 */
	interval?: CandleInterval;
}

/**
 * Get candles response
 */
export interface FinGetCandlesResponse extends List<Candle> {
}

/**
 * Get indicators request
 */
export interface FinGetIndicatorsRequest {
	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

		/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;

	/**
	 * Maximum number of candles to return
	 */
	maximumNumberOfCandles?: Integer;

	/**
	 * Candle interval
	 */
	interval?: CandleInterval;

	/**
	 * Candles
	 */
	candles: List<Candle>;
}

/**
 * Get indicators response
 */
export interface FinGetIndicatorsResponse extends Map<Indicator, IndicatorData> {
}

/**
 * Get balances request
 */
export interface FinGetBalancesRequest {
	/**
	 * Address
	 */
	walletAddress?: WalletAddress;

	/**
	 * Wallet
	 */
	wallet?: Wallet;

	/**
	 * Token addresses to filter balances (optional)
	 */
	tokenAddresses?: List<TokenAddress> | TokenAddress[];

	/**
	 * Token symbols to filter balances
	 */
	tokenSymbols?: List<TokenSymbol> | TokenSymbol[];
}

/**
 * Get balances response
 */
export interface FinGetBalancesResponse extends Balances {
}

/**
 * Get transaction request
 */
export interface FinGetTransactionRequest {
	/**
	 * Transaction hash
	 */
	hash: TransactionHash;

	/**
	 * Wait for confirmation
	 */
	waitForConfirmation?: Boolean;
}

/**
 * Get transaction response
 */
export interface FinGetTransactionResponse extends Transaction {
}

/**
 * Get order request
 */
export interface FinGetOrderRequest {
	/**
	 * Owner address (wallet that owns the order)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner
	 */
	owner?: Wallet;

	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;

	/**
	 * Order price
	 */
	orderPrice: OrderPrice;

	/**
	 * Order type
	 */
	orderType?: OrderType;

	/**
	 * Order side
	 */
	orderSide?: OrderSide;

	/**
	 * Order status
	 */
	orderStatus?: OrderStatus;
}

export interface FinGetOrderResponse extends Order {
}

/**
 * Get orders request
 */
export interface FinGetOrdersRequest {
	/**
	 * Owner address (wallet that owns the order)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner
	 */
	owner?: Wallet;

	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;

	/**
	 * Order IDs
	 */
	orderIds?: List<OrderId> | OrderId[];

	/**
	 * Orders
	 */
	orders?: List<Order> | Order[];

	/**
	 * Order price
	 */
	orderPrices?: List<OrderPrice> | OrderPrice[];

	/**
	 * Order type
	 */
	orderTypes?: List<OrderType> | OrderType[];

	/**
	 * Order side
	 */
	orderSides?: List<OrderSide> | OrderSide[];

	/**
	 * Order status
	 */
	orderStatuses?: List<OrderStatus> | OrderStatus[];

	/**
	 * Maximum number of orders to return
	 */
	maximumNumberOfOrders?: Integer;
}

/**
 * Get orders response
 */
export interface FinGetOrdersResponse extends Map<OrderId, Order> {
}

/**
 * Create order request
 */
export interface FinPlaceOrderRequest {
	/**
	 * Owner address (wallet that will create the order)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner
	 */
	owner?: Wallet;

	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;

	/**
	 * Order side (buy/sell)
	 */
	side: OrderSide;

	/**
	 * Order type (market/limit)
	 */
	type: OrderType;

	/**
	 * Order amount
	 */
	amount: OrderAmount;

	/**
	 * Order price (required for limit orders)
	 */
	price?: OrderPrice;
}

/**
 * Create order response
 */
export interface FinPlaceOrderResponse {
	/**
	 * Order that was created
	 */
	order: Order;

	/**
	 * Transaction details
	 */
	transaction: Transaction;
}

/**
 * Create orders request
 */
export interface FinPlaceOrdersRequest {
	/**
	 * Owner address (wallet that will create the orders)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner
	 */
	owner?: Wallet;

	/**
	 * List of orders to create
	 */
	orders: List<FinPlaceOrderRequest> | FinPlaceOrderRequest[];
}

/**
 * Create orders response
 */
export interface FinPlaceOrdersResponse {
	/**
	 * List of created orders
	 */
	orders: Map<OrderId, Order>;

	/**
	 * Transaction details
	 */
	transactions: Map<TransactionHash, Transaction>;
}

/**
 * Replace order request
 */
export interface FinReplaceOrderRequest extends FinPlaceOrderRequest {
}

/**
 * Replace order response
 */
export interface FinReplaceOrderResponse extends FinPlaceOrderResponse {
}

/**
 * Replace orders request
 */
export interface FinReplaceOrdersRequest extends FinPlaceOrdersRequest {
}

/**
 * Replace orders response
 */
export interface FinReplaceOrdersResponse extends FinPlaceOrdersResponse {
}

/**
 * Cancel order request
 */
export interface FinCancelOrderRequest {
	/**
	 * Order ID
	 */
	orderId?: OrderId;

	/**
	 * Order
	 */
	order?: Order;

	/**
	 * Owner address (wallet that will cancel the order)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner
	 */
	owner?: Wallet;

	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;
}

/**
 * Cancel order response
 */
export interface FinCancelOrderResponse {
	/**
	 * Order that was cancelled
	 */
	order: Order;

	/**
	 * Transaction details
	 */
	transaction: Transaction;
}

/**
 * Cancel orders request
 */
export interface FinCancelOrdersRequest {
	/**
	 * Order IDs
	 */
	orderIds?: List<OrderId> | OrderId[];

	/**
	 * Orders
	 */
	orders?: List<Order> | Order[];

	/**
	 * Owner address (wallet that will cancel the orders)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner
	 */
	owner?: Wallet;

	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;
}

/**
 * Cancel orders response
 */
export interface FinCancelOrdersResponse {
	/**
	 * List of cancelled orders
	 */
	orders: Map<OrderId, Order>;

	/**
	 * Transaction details
	 */
	transactions: Map<TransactionHash, Transaction>;
}

/**
 * Cancel all orders request
 */
export interface FinCancelAllOrdersRequest extends FinCancelOrdersRequest {
}

/**
 * Cancel all orders response
 */
export interface FinCancelAllOrdersResponse extends FinCancelOrdersResponse {
}

/**
 * Withdraw from market request
 */
export interface FinWithdrawRequest {
	/**
	 * Owner address (wallet that will withdraw)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner
	 */
	owner?: Wallet;

	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market name
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market
	 */
	market?: Market;
}

/**
 * Withdraw from market response
 */
export interface FinWithdrawResponse {
	/**
	 * List of withdrawn orders
	 */
	orders: Map<OrderId, Order>;

	/**
	 * Transaction details
	 */
	transactions: Map<TransactionHash, Transaction>;
}

/**
 * Unified order execution request that can handle place, replace, cancel, and withdraw operations
 */
export interface FinExecuteOrdersRequest {
	/**
	 * Owner address (wallet that will execute the orders)
	 */
	ownerAddress?: WalletAddress;

	/**
	 * Owner wallet
	 */
	owner?: Wallet;

	/**
	 * Market address
	 */
	marketAddress?: MarketAddress;

	/**
	 * Market symbol
	 */
	marketSymbol?: MarketSymbol;

	/**
	 * Market object
	 */
	market?: Market;

	/**
	 * Order operations to execute
	 */
	orders: {
		/**
		 * Place new orders
		 */
		place?: List<FinPlaceOrderRequest>;

		/**
		 * Replace existing orders
		 */
		replace?: List<FinReplaceOrderRequest>;

		/**
		 * Cancel orders by IDs or order objects
		 */
		cancel?: List<OrderId> | List<Order> | OrderId[] | Order[];

		/**
		 * Withdraw filled orders by IDs or order objects
		 */
		withdraw?: List<OrderId> | List<Order> | OrderId[] | Order[];
	};
}

/**
 * Unified order execution response
 */
export interface FinExecuteOrdersResponse {
	/**
	 * Placed orders (if any)
	 */
	placedOrders?: Map<OrderId, Order>;

	/**
	 * Replaced orders (if any)
	 */
	replacedOrders?: Map<OrderId, Order>;

	/**
	 * Cancelled orders (if any)
	 */
	cancelledOrders?: Map<OrderId, Order>;

	/**
	 * Withdrawn orders (if any)
	 */
	withdrawnOrders?: Map<OrderId, Order>;

	/**
	 * All transactions from the execution
	 */
	transactions: Map<TransactionHash, Transaction>;
}
