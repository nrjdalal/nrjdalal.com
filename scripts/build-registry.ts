#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { getAliases } from "./utils/aliases"
import { getFiles, normalizeAndFilter } from "./utils/files"

const config = {
  files: [],
  directories: ["@/components/default"],
}

const files = await getFiles()
const aliases = await getAliases()

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

const getImports = async ({ filePath }: { filePath: string }) => {
  const content: Record<string, string> = ({} = {})

  const data: { dependencies: string[]; files: string[] } = {
    dependencies: [],
    files: [],
  }

  const fileContent = content[filePath] || fs.readFileSync(filePath, "utf-8")
  content[filePath] = fileContent

  const importStatements = fileContent.match(
    /import\s+.*\s+from\s+['"].*['"]|import\s+['"].*['"]/g,
  )

  if (!importStatements) {
    data.files.push(filePath)
    content[filePath] = fileContent
    return { data, content }
  }

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
      resolvedPath =
        files.find((file) => file.startsWith(resolvedPath + ".")) || ""
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
    const importsData = await getImports({ filePath: file })
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

  data.files = [filePath, ...Array.from(uniqueFiles)]

  return { data, content }
}

const normalizeImports = ({
  imports,
  aliases,
}: {
  imports: {
    content: Record<string, string>
    data: {
      files: string[]
      dependencies: string[]
    }
  }
  aliases: Record<string, string>
}) => {
  if (Array.isArray(imports)) {
    return imports
  }

  const content = Object.fromEntries(
    Object.entries(imports.content).map(([key, value]) => {
      const aliasKey = Object.keys(aliases).find((alias) =>
        key.startsWith(aliases[alias]),
      )
      return [aliasKey ? key.replace(aliases[aliasKey], "") : key, value]
    }),
  )

  const files = imports.data.files.map((file: string) =>
    Object.keys(aliases).reduce(
      (acc, alias) => acc.replace(aliases[alias], ""),
      file,
    ),
  )
  return { ...imports, content, data: { ...imports.data, files } }
}

for (const file of configFiles) {
  const imports = normalizeImports({
    imports: await getImports({
      filePath: file,
    }),
    aliases,
  })

  const name = imports.data.files[0]
    .replace(/^block\//, "")
    .replace(/^components\/ui\//, "")
    .replace(/^components\//, "")
    .replace(/^hooks\//, "")
    .replace(/^lib\//, "")
    .replace(/\..*$/, "")
    .replace(/\//g, "-")

  const getType = (filePath: string) => {
    return (
      filePath
        .match(/^(block|components\/ui|components|hooks|lib)/)?.[0]
        .replace("components/ui", "registry:ui")
        .replace("components", "registry:component")
        .replace("hooks", "registry:hooks")
        .replace("lib", "registry:lib")
        .replace("block", "registry:block") || "registry:file"
    )
  }

  const outputPath = path.join("public", "r", `${name}.json`)
  const outputData = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: getType(imports.data.files[0]),
    files: imports.data.files.map((file) => {
      return {
        type: getType(file),
        path: file,
        target: file,
        content: imports.content[file],
      }
    }),
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(
    outputPath,
    JSON.stringify(outputData, null, 2) + "\n",
    "utf-8",
  )
}
