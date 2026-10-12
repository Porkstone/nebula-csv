import { describe, it, expect } from "vitest";
import { parseCsv, selectRows } from "./csv";
import { emptyView, emptyWorkspace, tabsReducer } from "./tabs";
import type { CsvTab } from "./tabs";

function tab(id: string): CsvTab {
  return {
    id,
    name: "same.csv",
    data: parseCsv("City,Amount\nLondon,10\nBristol,2\nLondon,1"),
    view: emptyView(),
  };
}
describe("CSV tabs", () => {
  it("appends files, including duplicate filenames, without replacing previews", () => {
    const first = tabsReducer(emptyWorkspace, {
      type: "open",
      tabs: [tab("a")],
    });
    const state = tabsReducer(first, {
      type: "open",
      tabs: [tab("b"), tab("c")],
    });
    expect(state.tabs.map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(state.activeId).toBe("c");
    expect(state.tabs[0]).toBe(first.tabs[0]);
  });
  it("preserves independent filters, sort, search, hidden columns and pagination", () => {
    let state = tabsReducer(emptyWorkspace, {
      type: "open",
      tabs: [tab("a"), tab("b")],
    });
    state = tabsReducer(state, {
      type: "update",
      id: "a",
      view: {
        filters: { 0: "London" },
        hidden: [0],
        sort: { column: 1, direction: "asc" },
        search: "London",
        page: 2,
        columnsOpen: true,
      },
    });
    state = tabsReducer(state, { type: "activate", id: "b" });
    expect(state.tabs[1].view).toEqual(emptyView());
    state = tabsReducer(state, { type: "activate", id: "a" });
    const { data, view } = state.tabs[0];
    expect(
      selectRows(data, view.filters, view.search, view.sort).map(
        (r) => r.cells[1],
      ),
    ).toEqual(["1", "10"]);
    expect(view.hidden).toEqual([0]);
    expect(view.page).toBe(2);
    expect(view.columnsOpen).toBe(true);
  });
  it("resets only the requested tab", () => {
    let state = tabsReducer(emptyWorkspace, {
      type: "open",
      tabs: [tab("a"), tab("b")],
    });
    state = tabsReducer(state, {
      type: "update",
      id: "a",
      view: { search: "London" },
    });
    state = tabsReducer(state, {
      type: "update",
      id: "b",
      view: { hidden: [1] },
    });
    state = tabsReducer(state, { type: "reset", id: "b" });
    expect(state.tabs[0].view.search).toBe("London");
    expect(state.tabs[1].view).toEqual(emptyView());
  });
  it("keeps the active preview when closing a background tab", () => {
    const state = tabsReducer(
      tabsReducer(emptyWorkspace, { type: "open", tabs: [tab("a"), tab("b")] }),
      { type: "close", id: "a" },
    );
    expect(state.activeId).toBe("b");
    expect(state.tabs.map((t) => t.id)).toEqual(["b"]);
  });
  it("selects the next tab or previous last tab when the active tab closes", () => {
    let state = tabsReducer(emptyWorkspace, {
      type: "open",
      tabs: [tab("a"), tab("b"), tab("c")],
    });
    state = tabsReducer(state, { type: "activate", id: "b" });
    state = tabsReducer(state, { type: "close", id: "b" });
    expect(state.activeId).toBe("c");
    state = tabsReducer(state, { type: "close", id: "c" });
    expect(state.activeId).toBe("a");
    state = tabsReducer(state, { type: "close", id: "a" });
    expect(state).toEqual(emptyWorkspace);
  });
  it("ignores empty opens and stale tab selections", () => {
    expect(tabsReducer(emptyWorkspace, { type: "open", tabs: [] })).toBe(
      emptyWorkspace,
    );
    expect(
      tabsReducer(emptyWorkspace, { type: "activate", id: "missing" }),
    ).toBe(emptyWorkspace);
    expect(tabsReducer(emptyWorkspace, { type: "close", id: "missing" })).toBe(
      emptyWorkspace,
    );
  });
});
