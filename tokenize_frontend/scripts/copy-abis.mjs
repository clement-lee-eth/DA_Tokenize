#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'

async function main() {
  const [, , outDirArg, destDirArg] = process.argv
  if (!outDirArg || !destDirArg) {
    console.error('Usage: node scripts/copy-abis.mjs <foundry_out_dir> <dest_dir>')
    process.exit(1)
  }
  const outDir = path.resolve(outDirArg)
  const destDir = path.resolve(destDirArg)
  await fs.mkdir(destDir, { recursive: true })

  const pairs = [
    ['RealEstateToken.sol', 'RealEstateToken.json'],
    ['ComplianceManager.sol', 'ComplianceManager.json']
  ]

  for (const [folder, file] of pairs) {
    const src = path.join(outDir, folder, file)
    const dst = path.join(destDir, file)
    const data = await fs.readFile(src, 'utf-8')
    await fs.writeFile(dst, data)
    console.log(`Copied ${src} -> ${dst}`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })

