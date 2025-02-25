import fs from "node:fs"
import path from "node:path"
import { glob } from "tinyglobby"

const config = {
  files: [],
  directories: ["@/registry/default"],
}

const getFiles = async ({
  patterns = ["**", ".**"],
  ignore = [] as string[],
} = {}) => {
  patterns = Array.isArray(patterns) ? patterns : [patterns]
  ignore = Array.isArray(ignore) ? ignore : [ignore]

  if (fs.existsSync(".gitignore")) {
    const gitignorePatterns: string[] = (
      await fs.promises.readFile(".gitignore", "utf8")
    )
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.replace(/^\//, ""))
    ignore = ignore.concat(gitignorePatterns)
  }

  return await glob(patterns, {
    ignore: ignore.filter((ig) => !patterns.includes(ig)),
  })
}

const normalizeAndFilter = ({
  paths = [],
  directory = false,
  aliases = {},
  files = [],
}: {
  paths: string[]
  directory?: boolean
  aliases?: Record<string, string>
  files?: string[]
}): string[] => {
  return paths
    .map((path) => {
      path = path.replace(/^\.\//, "")
      for (const alias in aliases) {
        if (path.startsWith(alias)) {
          return path.replace(alias, aliases[alias])
        }
      }
      return path
    })
    .filter((path) => {
      if (directory) {
        return files.some((file) => file.startsWith(path))
      } else {
        return files.includes(path)
      }
    })
}

const getAliases = async () => {
  const isTypescript = fs.existsSync("tsconfig.json")

  if (isTypescript) {
    let tsconfig = await fs.promises.readFile("tsconfig.json", "utf8")
    tsconfig = tsconfig.replace(/,\s*([\}\]])/g, "$1")
    const { compilerOptions } = JSON.parse(tsconfig)
    if (compilerOptions && compilerOptions.paths) {
      return Object.entries(
        compilerOptions.paths as Record<string, [string]>,
      ).reduce(
        (acc, [key, [value]]) => {
          acc[key.replace(/\*$/, "")] = value
            .replace(/^\.\//, "")
            .replace(/\*$/, "")
          return acc
        },
        {} as Record<string, string>,
      )
    }
  }

  return {}
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
  const content: Record<string, string> = {}

  const data: { dependencies: string[]; files: string[] } = {
    dependencies: [],
    files: [],
  }

  const fileContent = content[filePath] || fs.readFileSync(filePath, "utf-8")

  content[filePath] = fileContent

  const importStatements = fileContent.match(
    /import\s+[\s\S]*?\s+from\s+['"].*['"]|import\s+['"].*['"]/g,
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
    content[file] = importsData.content[file]
    importsData.data.files.forEach((importFile) => uniqueFiles.add(importFile))
    importsData.data.dependencies.forEach((dependency) => {
      if (!data.dependencies.includes(dependency)) {
        data.dependencies.push(dependency)
      }
    })
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
  const normalizePath = (file: string) => {
    return file
      .replace(/^registry\/[^\/]+\/blocks\//, "blocks/")
      .replace(/^registry\/([^\/]+)\/components\//, "components/$1/")
      .replace(/^registry\/[^\/]+\/ui\//, "components/ui/")
      .replace(/^registry\/[^\/]+\/hooks\//, "hooks/")
      .replace(/^registry\/[^\/]+\/lib\//, "lib/")
  }

  const content = Object.fromEntries(
    Object.entries(imports.content).map(([key, value]) => {
      const aliasKey = Object.keys(aliases).find((alias) =>
        key.startsWith(aliases[alias]),
      )
      const normalizedKey = aliasKey ? key.replace(aliases[aliasKey], "") : key
      return [normalizePath(normalizedKey), value]
    }),
  )

  const target = imports.data.files.map((file: string) =>
    normalizePath(
      Object.keys(aliases).reduce(
        (acc, alias) => acc.replace(aliases[alias], ""),
        file,
      ),
    ),
  )

  const dependencies = imports.data.dependencies.filter(
    (dep) => !dep.startsWith("node:"),
  )

  const normalizedContent = Object.fromEntries(
    Object.entries(content).map(([key, value]) => {
      return [
        key,
        value
          .replace(/import\s+['"](.*)['"]/, (match, p1) => {
            const aliasKey = Object.keys(aliases).find((alias) =>
              p1.startsWith(alias),
            )
            if (aliasKey) {
              return `import "${p1.replace(aliasKey, aliases[aliasKey])}"`
            }
            return match
          })
          .replace(/@\/registry\/[^\/]+\/blocks\//g, "@/blocks/")
          .replace(/@\/registry\/([^\/]+)\/components\//g, "@/components/$1/")
          .replace(/@\/registry\/[^\/]+\/ui\//g, "@/components/ui/")
          .replace(/@\/registry\/[^\/]+\/hooks\//g, "@/hooks/")
          .replace(/@\/registry\/[^\/]+\/lib\//g, "@/lib/"),
      ]
    }),
  )

  return {
    content: normalizedContent,
    data: { dependencies, files: target, orignal: imports.data.files },
  }
}

for (const file of configFiles) {
  const imports = normalizeImports({
    imports: await getImports({
      filePath: file,
    }),
    aliases,
  })

  const name = imports.data.files[0]
    .replace(/^registry\/[^\/]+\/blocks\//, "blocks/")
    .replace(/^registry\/([^\/]+)\/components\//, "components/$1/")
    .replace(/^registry\/[^\/]+\/ui\//, "components/ui/")
    .replace(/^registry\/[^\/]+\/hooks\//, "hooks/")
    .replace(/^registry\/[^\/]+\/lib\//, "lib/")
    .replace(/^blocks\//, "")
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
        .replace("hooks", "registry:hook")
        .replace("lib", "registry:lib")
        .replace("blocks", "registry:block") || "registry:file"
    )
  }

  const outputPath = path.join("public", "r", `${name}.json`)
  const outputData = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: getType(imports.data.files[0]),
    dependencies: imports.data.dependencies,
    files: imports.data.files.map((file) => {
      return {
        type: getType(file),
        target: file,
        content: imports.content[file],
        path: imports.data.orignal[imports.data.files.indexOf(file)],
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
