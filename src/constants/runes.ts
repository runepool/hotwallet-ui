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
    symbol: 'RNP',
    name: 'RUNE•POOL•TOKEN',
    icon: 'https://ord.runepool.org/preview/06d3e90d5df1efe962d4bf2bf2be1e5fdb6fb697948e5628fb95bc5bc220a088i0',
    metadata: {
      description: 'Much wow, such coin'
    },
    decimals: 5
  }
];

export type AvailableToken = typeof AVAILABLE_TOKENS[number];