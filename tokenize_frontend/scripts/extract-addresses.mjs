#!/usr/bin/env node
import { promises as fs } from 'node:fs'

async function main() {
  const [, , broadcastPath] = process.argv
  if (!broadcastPath) {
    console.error('Usage: node scripts/extract-addresses.mjs <broadcast_run-latest.json>')
    process.exit(1)
  }
  const raw = await fs.readFile(broadcastPath, 'utf-8')
  const json = JSON.parse(raw)
  // Foundry broadcast format: transactions with contractName/address
  const result = {}
  for (const tx of json.transactions || []) {
    if (tx.contractName && tx.contractAddress) {
      result[tx.contractName] = tx.contractAddress
    }
  }
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => { console.error(err); process.exit(1) })
