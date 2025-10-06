import React from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'
import '@rainbow-me/rainbowkit/styles.css'

const localhost31337 = defineChain({
  id: 31337,
  name: 'Anvil Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [import.meta.env.VITE_RPC_URL || 'http://localhost:8545'] } },
})

const { wallets } = getDefaultWallets({
  appName: 'Tokenize Frontend',
  projectId: 'localhost',
  chains: [localhost31337],
})

const config = createConfig({
  chains: [localhost31337],
  transports: { [localhost31337.id]: http(localhost31337.rpcUrls.default.http[0]) },
})

const queryClient = new QueryClient()

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={[localhost31337]} theme={darkTheme({ accentColor: '#001A72' })} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
