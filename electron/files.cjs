const path = require("node:path");
const fs = require("node:fs/promises");
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const supported = new Set([".csv", ".tsv", ".txt"]);

function fileFromArguments(args, workingDirectory) {
  const candidate = args.find(
    (arg) =>
      typeof arg === "string" &&
      !arg.startsWith("-") &&
      supported.has(path.extname(arg).toLowerCase()),
  );
  return candidate ? path.resolve(workingDirectory, candidate) : null;
}

async function readCsvFile(filename) {
  if (!supported.has(path.extname(filename).toLowerCase()))
    throw new Error("Choose a .csv, .tsv, or .txt file.");
  const handle = await fs.open(filename, "r");
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new Error("Please choose a regular file.");
    if (stat.size > MAX_FILE_SIZE)
      throw new Error("This file exceeds the 50 MB preview limit.");
    return {
      name: path.basename(filename),
      text: await handle.readFile({ encoding: "utf8" }),
    };
  } finally {
    await handle.close();
  }
}

module.exports = { fileFromArguments, readCsvFile, MAX_FILE_SIZE };
