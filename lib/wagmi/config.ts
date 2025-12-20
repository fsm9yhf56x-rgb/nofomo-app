import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arbitrum, mainnet } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'NoFOMO',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'METTRE_TON_PROJECT_ID_ICI',
  chains: [arbitrum, mainnet],
  ssr: true,
})
