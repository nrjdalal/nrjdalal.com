import { getAliases } from "./utils/aliases"
import { getFiles, normalizeAndFilter } from "./utils/files"

let config: { files: string[]; directories: string[] } = {
  files: [],
  directories: ["@/components/nui"],
}

const files = await getFiles()
const aliases = await getAliases()

config = {
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

console.log(config)
