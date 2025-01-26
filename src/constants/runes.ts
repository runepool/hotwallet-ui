interface TokenInfo {
  symbol: string;
  name: string;
  icon: string;
  metadata: {
    description: string;
  };
  decimals: number;
}

export const AVAILABLE_TOKENS: TokenInfo[] = [
  {
    symbol: 'DOG',
    name: 'DOG•GO•TO•THE•MOON',
    icon: 'https://img-cdn.magiceden.dev/rs:fill:128:0:0/plain/https%3A%2F%2Ford-mirror.magiceden.dev%2Fcontent%2Fe79134080a83fe3e0e06ed6990c5a9b63b362313341745707a2bff7d788a1375i0',
    metadata: {
      description: 'Much wow, such coin'
    },
    decimals: 5
  },
  {
    symbol: 'LIQUIDIUM',
    name: 'LIQUIDIUM•TOKEN',
    icon: 'https://img-cdn.magiceden.dev/rs:fill:128:0:0/plain/https%3A%2F%2Fbafybeigysekcnztzug5cg4nmm4m3kimrudptuyxyv7cbsrdhpu57ok5fty.ipfs.w3s.link%2FToken%2520Symbol%25201024x.png',
    metadata: {
      description: 'Liquidium is a decentralized liquidity protocol for Bitcoin Runes'
    },
    decimals: 2
  }
];

export type AvailableToken = typeof AVAILABLE_TOKENS[number];