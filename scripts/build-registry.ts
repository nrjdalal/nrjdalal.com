import { getAliases } from "./utils/aliases"
import { getFiles, normalizeAndFilter } from "./utils/files"

const config = {
  files: [],
  directories: ["@/components/nui"],
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

const allFiles = [
  ...normalizedConfig.files,
  ...files.filter((file) =>
    normalizedConfig.directories.some((dir) => file.startsWith(dir)),
  ),
]

console.log(allFiles)
