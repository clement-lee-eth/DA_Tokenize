import { getEnv } from './env'

export const { token: REAL_ESTATE_TOKEN_ADDRESS, manager: COMPLIANCE_MANAGER_ADDRESS } = getEnv()

export const ABIS = {
  RealEstateToken: () => import('../abis/RealEstateToken.json').then((m: any) => (m.abi ?? m.default?.abi ?? m.default)),
  ComplianceManager: () => import('../abis/ComplianceManager.json').then((m: any) => (m.abi ?? m.default?.abi ?? m.default)),
}
