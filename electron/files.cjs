const path = require("node:path");
const fs = require("node:fs/promises");
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const supported = new Set([".csv", ".tsv", ".txt"]);

function filesFromArguments(args, workingDirectory) {
  return args
    .filter(
      (arg) =>
        typeof arg === "string" &&
        !arg.startsWith("-") &&
        supported.has(path.extname(arg).toLowerCase()),
    )
    .map((filename) => path.resolve(workingDirectory, filename));
}
function fileFromArguments(args, workingDirectory) {
  return filesFromArguments(args, workingDirectory)[0] ?? null;
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

async function fileOpenResult(filename) {
  try {
    return { file: await readCsvFile(filename) };
  } catch (error) {
    const detail =
      error.code === "ENOENT"
        ? "The file no longer exists."
        : ["EACCES", "EPERM"].includes(error.code)
          ? "Check that you have permission to read it."
          : error.message;
    return { error: `Could not open ${path.basename(filename)}. ${detail}` };
  }
}

module.exports = {
  fileFromArguments,
  filesFromArguments,
  readCsvFile,
  fileOpenResult,
  MAX_FILE_SIZE,
};
