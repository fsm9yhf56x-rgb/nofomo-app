import { http, createConfig } from 'wagmi'
import { mainnet, arbitrum, optimism, base, bsc, polygon } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// MegaETH custom chain
export const megaeth = {
  id: 424242, // Replace with real MegaETH chain ID when available
  name: 'MegaETH',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.megaeth.io'] },
    public: { http: ['https://rpc.megaeth.io'] },
  },
  blockExplorers: {
    default: { name: 'MegaETH Explorer', url: 'https://explorer.megaeth.io' },
  },
} as const

export const config = createConfig({
  chains: [mainnet, arbitrum, optimism, base, bsc, polygon, megaeth as any],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo'
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [megaeth.id]: http(),
  },
})