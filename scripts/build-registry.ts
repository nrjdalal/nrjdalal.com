import fs from "node:fs"
import { glob } from "tinyglobby"

const files = async ({
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

const aliases = async () => {
  const isTypescript = (await files()).includes("tsconfig.json")

  if (isTypescript) {
    const tsconfig = await fs.promises.readFile("tsconfig.json", "utf8")
    const { compilerOptions } = JSON.parse(tsconfig)
    if (compilerOptions && compilerOptions.paths) {
      return Object.entries(
        compilerOptions.paths as Record<string, [string]>,
      ).reduce(
        (acc, [key, [value]]) => {
          acc[key.replace("/*", "")] = value.replace("/*", "")
          return acc
        },
        {} as Record<string, string>,
      )
    }
  }

  return {}
}

console.log(await aliases())
