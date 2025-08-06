import { properties } from "./properties";
import { Rujira } from "./rujira";
import { Market, MarketAddress, RujiraConstructorOptions, RujiraInitializeOptions, Token, TokenAddress, WalletMnemonic, WalletPrivateKey } from "./types";

(async function run() {
	const active = {
		getStatus: false,
		getTransaction: false,
		getAllTokens: false,
		getTokens: false,
		getToken: false,
		getAllMarkets: false,
		getMarkets: false,
		getMarket: false,
		getOrderBook: true,
		getTicker: false,
		getCandles: false,
		getIndicators: false,
		getBalances: false,
		getOrder: false,
	};

	const rujira = new Rujira({
		walletMnemonic: properties.getAs<WalletMnemonic | undefined>('rujira.wallet.mnemonic'),
		walletPrivateKey: properties.getAs<WalletPrivateKey | undefined>('rujira.wallet.privateKey'),
	} as RujiraConstructorOptions);

	await rujira.initialize({} as RujiraInitializeOptions);

	console.log('\n--------------------------------------------------------------------------------\n');

	if (active.getStatus) {
		const getStatus = await rujira.fin.getStatus({});
		console.log('getStatus:n', getStatus);
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getTransaction) {
		const getTransaction = await rujira.fin.getTransaction({
			hash: '07F95225F84BF9E5C69E4BAA54100F8AB078EB5801EB1761F8F70F746927B100'
		});
		console.log('getTransaction:\n', getTransaction);
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getAllTokens) {
		const getAllTokens = await rujira.fin.getAllTokens({});
		console.log('getAllTokens:size:', getAllTokens.size);
		console.log('getAllTokens:addresses:\n', getAllTokens.keySeq().toJS());
		console.log('getAllTokens:symbols\n', getAllTokens.valueSeq().map(token => token.symbol).toJS());
		console.log('getAllTokens:addresses->symbols:\n', getAllTokens.entrySeq().map((entry: [TokenAddress, Token]) => `${entry[0]} -> ${entry[1].symbol}`).toJS());
		// console.log('getAllTokens\n', getAllTokens.toJS());
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getTokens) {
		const getTokens = await rujira.fin.getTokens({
			addresses: [
				'thor.ruji', // RUJI
				'bsc-usdt-0x55d398326f99059ff775485246999027b3197955', // USDT
			],
			symbols: [
				'NAMI',
				'RUNE',
			]
		});
		console.log('getTokens:size:', getTokens.size);
		console.log('getTokens:addresses:\n', getTokens.keySeq().toJS());
		console.log('getTokens:symbols\n', getTokens.valueSeq().map(token => token.symbol).toJS());
		// console.log('getTokens\n', getTokens.toJS());
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getToken) {
		const getToken = await rujira.fin.getToken({
			address: 'avax-avax', // AVAX
			// symbol: 'AVAX'
		});
		console.log('getToken:address:', getToken.address);
		console.log('getToken:symbol:', getToken.symbol);
		console.log('getToken\n', getToken);
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getAllMarkets) {
		const getAllMarkets = await rujira.fin.getAllMarkets({});
		console.log('getAllMarkets:size:', getAllMarkets.size);
		console.log('getAllMarkets:addresses:\n', getAllMarkets.keySeq().toJS());
		console.log('getAllMarkets:symbols\n', getAllMarkets.valueSeq().map(market => market.symbol).toJS());
		console.log('getAllMarkets:addresses->symbols:\n', getAllMarkets.entrySeq().map((entry: [MarketAddress, Market]) => `${entry[0]} -> ${entry[1].symbol}`).toJS());
		// console.log('getAllMarkets\n', getAllMarkets.toJS());
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getMarkets) {
		const getMarkets = await rujira.fin.getMarkets({
			addresses: [
				'thor1dwsnlqw3lfhamc5dz3r57hlsppx3a2n2d7kppccxfdhfazjh06rs5077sz', // BTC/USDC
				'thor1ax94w4rldvdgc4xgsfwgve7g7xfyxhvuvquvx57vtmr6y4alev0qw3mlvr', // LQDY/USDC
			],
			symbols: [
				'RUJI/USDC',
				'RUJI/RUNE',
			]
		});
		console.log('getMarkets:size:', getMarkets.size);
		console.log('getMarkets:addresses:\n', getMarkets.keySeq().toJS());
		console.log('getMarkets:symbols:\n', getMarkets.valueSeq().map(market => market.symbol).toJS());
		// console.log('getMarkets\n', getMarkets.toJS());
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getMarket) {
		const getMarket = await rujira.fin.getMarket({
			// address: 'thor12ds7fxj5g47jwzfzvzzhzxxd3cp6v55flgwxva0803r8k5mzm44skth6wa',
				symbol: 'TCY/RUNE'
		});
		console.log('getMarket:address:', getMarket.address);
		console.log('getMarket:symbol:', getMarket.symbol);
		console.log('getMarket\n', getMarket);
		console.log('\n--------------------------------------------------------------------------------\n');
	}

	if (active.getOrderBook) {
		const getOrderBook = await rujira.fin.getOrderBook({
			marketAddress: 'thor17cawwg2lsnvcne69fek6nsqkf8snma6gc5ccceshul86rl0u3q4s5l5d0a ', // RUJI/USDC
			// marketSymbol: 'RUJI/USDC',
		});
		console.log('getOrderBook:\n', getOrderBook);
		console.log('\n--------------------------------------------------------------------------------\n');
	}
})();
