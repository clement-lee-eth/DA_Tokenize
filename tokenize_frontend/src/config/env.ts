export const getEnv = () => {
  const rpcUrl = import.meta.env.VITE_RPC_URL as string | undefined
  const token = import.meta.env.VITE_TOKEN_ADDRESS as string | undefined
  const manager = import.meta.env.VITE_MANAGER_ADDRESS as string | undefined
  if (!rpcUrl) throw new Error('VITE_RPC_URL is required')
  if (!token) console.warn('VITE_TOKEN_ADDRESS missing; reads will fail until set')
  if (!manager) console.warn('VITE_MANAGER_ADDRESS missing; reads will fail until set')
  return { rpcUrl, token, manager }
}
