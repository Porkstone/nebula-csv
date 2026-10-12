import Papa from "papaparse";
export type Dataset = {
  columns: string[];
  rows: string[][];
  delimiter: string;
  warnings: string[];
};
export type Sort = { column: number; direction: "asc" | "desc" } | null;
export function parseCsv(text: string): Dataset {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), {
    skipEmptyLines: "greedy",
  });
  if (!parsed.data.length)
    throw new Error(
      "This file is empty. Choose a CSV containing a header row and data.",
    );
  const [header, ...rows] = parsed.data;
  let width = header.length;
  for (const row of rows) width = Math.max(width, row.length);
  const columns = Array.from(
    { length: width },
    (_, i) => header[i]?.trim() || `Column ${i + 1}`,
  );
  const warnings = parsed.errors
    .filter((e) => e.code !== "UndetectableDelimiter")
    .map((e) => e.message);
  if (rows.some((row) => row.length !== header.length))
    warnings.push(
      "Some rows have a different number of fields. Missing cells are blank; extra fields are preserved.",
    );
  return {
    columns,
    rows,
    delimiter: parsed.meta.delimiter,
    warnings: [...new Set(warnings)],
  };
}
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});
export function selectRows(
  data: Dataset,
  filters: Record<number, string>,
  search: string,
  sort: Sort,
) {
  const query = search.toLocaleLowerCase();
  const active = Object.entries(filters).filter(([, value]) => value.length);
  const rows = data.rows
    .map((cells, index) => ({ cells, index }))
    .filter(
      ({ cells }) =>
        (!query ||
          cells.some((cell) => cell.toLocaleLowerCase().includes(query))) &&
        active.every(([column, value]) =>
          (cells[Number(column)] ?? "")
            .toLocaleLowerCase()
            .includes(value.toLocaleLowerCase()),
        ),
    );
  if (sort)
    rows.sort((a, b) => {
      const left = a.cells[sort.column] ?? "",
        right = b.cells[sort.column] ?? "";
      const numeric =
        left.trim() !== "" &&
        right.trim() !== "" &&
        Number.isFinite(Number(left)) &&
        Number.isFinite(Number(right));
      const result = numeric
        ? Number(left) - Number(right)
        : collator.compare(left, right);
      return (sort.direction === "asc" ? result : -result) || a.index - b.index;
    });
  return rows;
}
