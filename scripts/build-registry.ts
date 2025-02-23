import { getAliases } from "./utils/aliases"
import { getFiles, normalizeAndFilter } from "./utils/files"

const config = {
  files: [],
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

console.log(configFiles)
