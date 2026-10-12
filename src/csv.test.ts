import { describe, it, expect } from "vitest";
import { parseCsv, selectRows } from "./csv";
describe("CSV parsing", () => {
  it("handles BOM, quoted commas, escaped quotes and multiline fields", () => {
    const data = parseCsv(
      '\uFEFFName,Notes\r\n"Chen, Amy","Said ""hi""\nThen left"\r\n',
    );
    expect(data.rows).toEqual([["Chen, Amy", 'Said "hi"\nThen left']]);
  });
  it("detects tabs and semicolons", () => {
    expect(parseCsv("A\tB\n1\t2").delimiter).toBe("\t");
    expect(parseCsv("A;B\n1;2").rows).toEqual([["1", "2"]]);
  });
  it("preserves ragged rows and duplicate headers", () => {
    const data = parseCsv("A,A\n1,2,3\n4");
    expect(data.columns).toEqual(["A", "A", "Column 3"]);
    expect(data.rows[0]).toEqual(["1", "2", "3"]);
    expect(data.warnings).toHaveLength(1);
  });
  it("rejects empty data and allows header-only files", () => {
    expect(() => parseCsv("  \n")).toThrow("empty");
    expect(parseCsv("A,B").rows).toEqual([]);
  });
});
describe("CSV view", () => {
  const data = parseCsv(
    "Name,City,Amount\nZoe,London,10\nAmy,Bristol,2\nAva,London,-1.5\nMax,London,2",
  );
  it("sorts numerically without changing source", () => {
    expect(
      selectRows(data, {}, "", { column: 2, direction: "asc" }).map(
        (r) => r.cells[2],
      ),
    ).toEqual(["-1.5", "2", "2", "10"]);
    expect(
      selectRows(data, {}, "", { column: 2, direction: "desc" })[0].cells[0],
    ).toBe("Zoe");
    expect(data.rows[0][0]).toBe("Zoe");
  });
  it("combines case-insensitive filters and global search", () => {
    expect(
      selectRows(data, { 1: "LONDON", 2: "2" }, "max", null).map(
        (r) => r.index,
      ),
    ).toEqual([3]);
    expect(selectRows(data, { 0: "missing" }, "", null)).toEqual([]);
  });
  it("restores source order", () => {
    expect(selectRows(data, {}, "", null).map((r) => r.index)).toEqual([
      0, 1, 2, 3,
    ]);
  });
});
