const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const {
  fileFromArguments,
  readCsvFile,
  MAX_FILE_SIZE,
} = require("./files.cjs");
let root;
before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "nebula-csv-tests-"));
});
after(async () => {
  if (!root) return;
  assert.ok(root.startsWith(path.resolve(os.tmpdir()) + path.sep));
  assert.ok(path.basename(root).startsWith("nebula-csv-tests-"));
  await fs.rm(root, { recursive: true, force: true });
});

test("resolves CSV names with spaces and Unicode from the launching directory", () => {
  const name = "London team résumé.CSV";
  assert.equal(fileFromArguments([name], root), path.join(root, name));
});
test("ignores Electron flags and unrelated files", () => {
  assert.equal(
    fileFromArguments(
      [
        "--original-process-start-time=123",
        "image.png",
        "--csv=ignore.csv",
        "qa.csv",
      ],
      root,
    ),
    path.join(root, "qa.csv"),
  );
  assert.equal(fileFromArguments(["--help", "image.png"], root), null);
});
test("keeps an absolute path intact when a second instance has a different cwd", () => {
  const filename = path.join(root, "qa.csv");
  assert.equal(fileFromArguments([filename], os.tmpdir()), filename);
});
test("reads UTF-8 data and preserves the filename for the renderer", async () => {
  const filename = path.join(root, "team résumé.csv");
  const text = "Name,City\nRenée,Montréal\n";
  await fs.writeFile(filename, text);
  assert.deepEqual(await readCsvFile(filename), {
    name: "team résumé.csv",
    text,
  });
});
test("allows the native picker's other delimited formats", async () => {
  const filename = path.join(root, "sample.tsv");
  await fs.writeFile(filename, "A\tB\n1\t2");
  assert.equal((await readCsvFile(filename)).text, "A\tB\n1\t2");
});
test("rejects unsupported extensions", async () => {
  await assert.rejects(readCsvFile(path.join(root, "image.png")), /Choose a/);
});
test("reports missing files and rejects directories", async () => {
  await assert.rejects(readCsvFile(path.join(root, "missing.csv")), {
    code: "ENOENT",
  });
  const filename = path.join(root, "directory.csv");
  await fs.mkdir(filename);
  await assert.rejects(readCsvFile(filename), /regular file/);
});
test("rejects files above 50 MB before reading their contents", async () => {
  const filename = path.join(root, "too-large.csv");
  const handle = await fs.open(filename, "w");
  await handle.truncate(MAX_FILE_SIZE + 1);
  await handle.close();
  await assert.rejects(readCsvFile(filename), /50 MB/);
});
