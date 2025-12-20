'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const WalletProvider = dynamic(
  () => import('@/components/WalletProvider').then((mod) => mod.WalletProvider),
  { ssr: false }
)

export function ClientLayout({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
