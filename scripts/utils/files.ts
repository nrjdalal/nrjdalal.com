import fs from "node:fs"
import { glob } from "tinyglobby"

export const getFiles = async ({
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

export const normalizeAndFilter = ({
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
