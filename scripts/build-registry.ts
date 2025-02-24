#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { getAliases } from "./utils/aliases"
import { getFiles, normalizeAndFilter } from "./utils/files"

const config = {
  files: ["src/app/layout.tsx"],
  directories: ["@/components/nui"],
}

const files = await getFiles()
const aliases = await getAliases()

console.log(aliases)

const normalizedConfig = {
  files: normalizeAndFilter({
    paths: config.files,
    files,
    aliases,
  }),
  directories: normalizeAndFilter({
    paths: config.directories,
    files,
    aliases,
    directory: true,
  }),
}

const configFiles = [
  ...normalizedConfig.files,
  ...files.filter((file) =>
    normalizedConfig.directories.some((directory) =>
      file.startsWith(directory),
    ),
  ),
]

const getImports = async (filePath: string) => {
  const content: Record<string, string> = ({} = {})

  const data: { dependencies: string[]; files: string[] } = {
    dependencies: [],
    files: [],
  }

  const fileContent = await fs.promises.readFile(filePath, "utf8")

  content[filePath] = fileContent

  const importStatements = fileContent.match(
    /import\s+.*\s+from\s+['"].*['"]|import\s+['"].*['"]/g,
  )
  if (!importStatements) return []

  const importFroms = importStatements
    .map((statement) => {
      const match = statement.match(/['"](.*)['"]/)
      return match ? match[1] : null
    })
    .filter((importFrom): importFrom is string => Boolean(importFrom))

  for (const importFrom of importFroms) {
    const aliasKey = Object.keys(aliases).find((key) =>
      importFrom.startsWith(key),
    )
    if (aliasKey) {
      let resolvedPath = path.join(
        aliases[aliasKey],
        importFrom.slice(aliasKey.length),
      )
      resolvedPath = files.find((file) => file.startsWith(resolvedPath)) || ""
      if (!data.files.includes(resolvedPath)) {
        data.files.push(resolvedPath)
      }
    } else if (importFrom.startsWith(".")) {
      let resolvedPath = path.join(path.dirname(filePath), importFrom)
      resolvedPath = files.find((file) => file.startsWith(resolvedPath)) || ""
      if (!data.files.includes(resolvedPath)) {
        data.files.push(resolvedPath)
      }
    } else {
      const packageName = importFrom.startsWith("@")
        ? importFrom.split("/").slice(0, 2).join("/")
        : importFrom.split("/")[0]
      if (!data.dependencies.includes(packageName)) {
        data.dependencies.push(packageName)
      }
    }
  }

  const uniqueFiles = new Set(data.files)

  for (const file of uniqueFiles) {
    const importsData = await getImports(file)
    if (Array.isArray(importsData)) {
      importsData.forEach((importFile) => {
        uniqueFiles.add(importFile)
      })
    } else {
      content[file] = importsData.content[file]
      importsData.data.files.forEach((importFile) =>
        uniqueFiles.add(importFile),
      )
    }
  }

  data.files = Array.from(uniqueFiles)

  return { data, content }
}

for (const file of configFiles) {
  const imports = await getImports(file)
  console.log(imports)
}
