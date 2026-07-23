import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const outputPath = join(root, 'THIRD_PARTY_LICENSES.txt')
const rootPackage = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const pending = Object.keys(rootPackage.dependencies ?? {})
const packages = new Map()

while (pending.length > 0) {
  const name = pending.pop()
  if (!name || packages.has(name)) continue

  const packageDirectory = join(root, 'node_modules', ...name.split('/'))
  const metadata = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8'))
  const files = await readdir(packageDirectory)
  const licenseFile = files
    .filter((file) => /^(licen[cs]e|copying|notice)(\.|$)/i.test(file))
    .sort((left, right) => left.localeCompare(right))[0]

  if (!metadata.license || !licenseFile) {
    throw new Error(`${name}@${metadata.version} is missing machine-readable license metadata or a license text file`)
  }

  const licenseText = (await readFile(join(packageDirectory, licenseFile), 'utf8')).trimEnd()
  const repository = typeof metadata.repository === 'string'
    ? metadata.repository
    : metadata.repository?.url

  packages.set(name, {
    name,
    version: metadata.version,
    license: metadata.license,
    source: metadata.homepage ?? repository ?? '(not declared)',
    licenseText,
  })

  pending.push(...Object.keys(metadata.dependencies ?? {}))
}

const divider = '='.repeat(80)
const rule = '-'.repeat(80)
const sections = [...packages.values()]
  .sort((left, right) => left.name.localeCompare(right.name))
  .map((dependency) => [
    divider,
    `${dependency.name}@${dependency.version}`,
    `License: ${dependency.license}`,
    `Source: ${dependency.source}`,
    rule,
    dependency.licenseText,
  ].join('\n'))

const output = [
  'THIRD-PARTY RUNTIME LICENSES',
  '',
  'This file contains the copyright notices and complete license texts for every',
  'npm runtime dependency included in the Dwarf Fortress Floor Portrait Studio',
  'production bundle. It is generated deterministically from package.json and the',
  'installed dependency tree by scripts/generate-third-party-licenses.mjs.',
  '',
  ...sections,
  divider,
  '',
].join('\n')

if (process.argv.includes('--check')) {
  const existing = await readFile(outputPath, 'utf8').catch(() => '')
  if (existing !== output) {
    throw new Error('THIRD_PARTY_LICENSES.txt is missing or stale; run npm run licenses:generate')
  }
  console.log(`Verified third-party license bundle for ${packages.size} runtime packages.`)
} else {
  await writeFile(outputPath, output)
  console.log(`Generated third-party license bundle for ${packages.size} runtime packages.`)
}
