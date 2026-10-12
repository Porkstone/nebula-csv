import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FileSpreadsheet,
  FolderOpen,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  RotateCcw,
  Upload,
  Filter,
} from "lucide-react";
import { parseCsv, selectRows } from "./csv";
import { version } from "../package.json";
import { emptyView, emptyWorkspace, tabsReducer } from "./tabs";
import type { CsvTab, TabView } from "./tabs";
type FileOpenResult =
  { file: { name: string; text: string } } | { error: string };
declare global {
  interface Window {
    nebula?: {
      openFiles: () => Promise<FileOpenResult[]>;
      setTheme: (theme: string) => void;
      onFileOpened: (callback: (result: FileOpenResult) => void) => () => void;
    };
  }
}
const sample =
  "Name,Team,Location,Status,Projects,Revenue\nAmelia Chen,Design,London,Active,12,42500\nNoah Williams,Engineering,Bristol,Active,8,38750\nOlivia Martin,Marketing,Manchester,On leave,5,18200\nLiam Patel,Engineering,London,Active,16,64200\nSophia Evans,Design,Edinburgh,Active,9,31800\nJames Wilson,Sales,London,Active,21,98500\nIsabella Brown,Marketing,Bristol,On leave,4,12600\nOliver Taylor,Sales,Manchester,Active,14,57300\nMia Davies,Engineering,Edinburgh,Active,11,44900\nLucas Thomas,Design,London,Active,7,26400\nCharlotte Lee,Sales,Bristol,Active,18,78200\nEthan White,Marketing,London,Active,6,21750";
const PAGE_SIZE = 100;
export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("nebula-theme") || "system";
    } catch {
      return "system";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nebula-theme", theme);
    } catch {
      /* Storage can be unavailable. */
    }
    window.nebula?.setTheme(theme);
  }, [theme]);
  const [workspace, dispatch] = useReducer(tabsReducer, emptyWorkspace);
  const activeTab = workspace.tabs.find((tab) => tab.id === workspace.activeId);
  const data = activeTab?.data ?? null;
  const name = activeTab?.name ?? "";
  const { hidden, filters, sort, search, page, columnsOpen } =
    activeTab?.view ?? emptyView();
  function updateView(view: Partial<TabView>) {
    if (activeTab) dispatch({ type: "update", id: activeTab.id, view });
  }
  const setHidden = (hidden: number[]) => updateView({ hidden });
  const setFilters = (filters: Record<number, string>) =>
    updateView({ filters, page: 0 });
  const setSearch = (search: string) => updateView({ search, page: 0 });
  const setPage = (page: number) => updateView({ page });
  const setColumnsOpen = (columnsOpen: boolean) => updateView({ columnsOpen });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const tabButtons = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    tabButtons.current
      .get(workspace.activeId ?? "")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [workspace.activeId]);
  function reset() {
    if (activeTab) dispatch({ type: "reset", id: activeTab.id });
  }
  function loadFiles(results: FileOpenResult[]) {
    const tabs: CsvTab[] = [];
    const errors: string[] = [];
    for (const result of results) {
      if ("error" in result) {
        errors.push(result.error);
        continue;
      }
      try {
        tabs.push({
          id: crypto.randomUUID(),
          name: result.file.name,
          data: parseCsv(result.file.text),
          view: emptyView(),
        });
      } catch (e) {
        errors.push(
          `${result.file.name}: ${e instanceof Error ? e.message : "Could not read this CSV."}`,
        );
      }
    }
    dispatch({ type: "open", tabs });
    setError(errors.join(" "));
  }
  useEffect(
    () =>
      window.nebula?.onFileOpened((result) => {
        loadFiles([result]);
      }),
    [],
  );
  async function readFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    try {
      const results: FileOpenResult[] = [];
      for (const file of files) {
        if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
          results.push({
            error: `${file.name}: Choose a .csv, .tsv, or .txt file.`,
          });
        } else if (file.size > 50 * 1024 * 1024) {
          results.push({
            error: `${file.name}: This file exceeds the 50 MB preview limit.`,
          });
        } else {
          try {
            results.push({
              file: { name: file.name, text: await file.text() },
            });
          } catch {
            results.push({
              error: `${file.name}: The file could not be read. Please try again.`,
            });
          }
        }
      }
      loadFiles(results);
    } finally {
      setBusy(false);
    }
  }
  async function openFile() {
    if (!window.nebula) {
      fileInput.current?.click();
      return;
    }
    setBusy(true);
    try {
      const results = await window.nebula.openFiles();
      if (results.length) loadFiles(results);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message.replace(
              /^Error invoking remote method '[^']+': Error: /,
              "",
            )
          : "Could not open file.",
      );
    } finally {
      setBusy(false);
    }
  }
  function activateTab(id: string, focus = false) {
    dispatch({ type: "activate", id });
    if (focus) tabButtons.current.get(id)?.focus();
  }
  function closeTab(id: string) {
    const next = tabsReducer(workspace, { type: "close", id });
    dispatch({ type: "close", id });
    if (next.activeId) tabButtons.current.get(next.activeId)?.focus();
    else
      requestAnimationFrame(() => document.getElementById("open-csv")?.focus());
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        if (!busy) void openFile();
      } else if (e.key.toLowerCase() === "w" && activeTab) {
        e.preventDefault();
        closeTab(activeTab.id);
      } else if (e.key === "Tab" && workspace.tabs.length) {
        e.preventDefault();
        const index = workspace.tabs.findIndex(
          (tab) => tab.id === workspace.activeId,
        );
        activateTab(
          workspace.tabs[
            (index + (e.shiftKey ? -1 : 1) + workspace.tabs.length) %
              workspace.tabs.length
          ].id,
          true,
        );
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const rows = useMemo(
    () => (data ? selectRows(data, filters, search, sort) : []),
    [data, filters, search, sort],
  );
  const visible =
    data?.columns
      .map((label, index) => ({ label, index }))
      .filter((c) => !hidden.includes(c.index)) ?? [];
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const maxPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
  const currentPage = Math.min(page, maxPage);
  function toggleColumn(index: number) {
    setHidden(
      hidden.includes(index)
        ? hidden.filter((i) => i !== index)
        : [...hidden, index],
    );
  }
  function cycleSort(column: number) {
    updateView({
      sort:
        sort?.column === column
          ? sort.direction === "asc"
            ? { column, direction: "desc" }
            : null
          : { column, direction: "asc" },
      page: 0,
    });
  }
  return (
    <div
      className="app"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void readFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            Nebula<span>CSV Viewer</span>
          </div>
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <div className="nav-item active">
          <FileSpreadsheet size={18} /> File preview{" "}
          <span className="nav-dot" />
        </div>
        <div className="sidebar-file">
          <span className="sidebar-label">CURRENT FILE</span>
          {data ? (
            <div className="current-file">
              <FileSpreadsheet size={17} />
              <span title={name}>{name}</span>
            </div>
          ) : (
            <p>No file opened yet</p>
          )}
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={19} />
          <div>
            Your data stays yours.
            <p>
              Files are processed locally.
              <br />
              No uploads. No account needed.
            </p>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>File preview</strong>
          </div>
          <div className="header-actions">
            <div className="theme-control">
              <label htmlFor="theme">Appearance</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <button
              id="open-csv"
              className="primary"
              onClick={() => void openFile()}
              disabled={busy}
            >
              <FolderOpen size={18} />
              {busy ? "Opening…" : "Open CSV"}
              <kbd>Ctrl O</kbd>
            </button>
          </div>
        </header>
        {workspace.tabs.length > 0 && (
          <div className="file-tabs" role="tablist" aria-label="Open CSV files">
            {workspace.tabs.map((tab, index) => (
              <div
                className={`file-tab ${tab.id === workspace.activeId ? "active" : ""}`}
                key={tab.id}
                role="presentation"
              >
                <button
                  ref={(button) => {
                    if (button) tabButtons.current.set(tab.id, button);
                    else tabButtons.current.delete(tab.id);
                  }}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={tab.id === workspace.activeId}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={tab.id === workspace.activeId ? 0 : -1}
                  className="file-tab-label"
                  title={tab.name}
                  onClick={() => activateTab(tab.id)}
                  onKeyDown={(e) => {
                    let target = index;
                    if (e.key === "ArrowRight")
                      target = (index + 1) % workspace.tabs.length;
                    else if (e.key === "ArrowLeft")
                      target =
                        (index - 1 + workspace.tabs.length) %
                        workspace.tabs.length;
                    else if (e.key === "Home") target = 0;
                    else if (e.key === "End")
                      target = workspace.tabs.length - 1;
                    else if (e.key === "Delete") {
                      e.preventDefault();
                      closeTab(tab.id);
                      return;
                    } else return;
                    e.preventDefault();
                    activateTab(workspace.tabs[target].id, true);
                  }}
                >
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  <span>{tab.name}</span>
                </button>
                <button
                  className="close-tab"
                  aria-label={`Close ${tab.name}`}
                  title="Close tab (Ctrl+W)"
                  onClick={() => closeTab(tab.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {workspace.tabs
          .filter((tab) => tab.id !== workspace.activeId)
          .map((tab) => (
            <section
              key={tab.id}
              id={`panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              hidden
            />
          ))}
        <section
          className="content"
          role={activeTab ? "tabpanel" : undefined}
          id={activeTab ? `panel-${activeTab.id}` : undefined}
          aria-labelledby={activeTab ? `tab-${activeTab.id}` : undefined}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.tsv,.txt"
            multiple
            className="hidden"
            aria-label="Choose CSV file"
            onChange={(e) => {
              void readFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          {error && (
            <div role="alert" className="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {!data ? (
            <div className="empty">
              <div className="empty-art">
                <FileSpreadsheet size={44} strokeWidth={1.4} />
                <span>
                  <Sparkles size={19} />
                </span>
              </div>
              <span className="eyebrow">FROM RAW DATA TO REAL INSIGHT</span>
              <h2>Meet your next clear view.</h2>
              <p>
                Drop CSV files here to get started.
                <br />
                Sort, filter, and focus on the columns you need.
              </p>
              <button className="primary" onClick={() => void openFile()}>
                <Upload size={17} /> Choose a file
              </button>
              <button
                className="sample-link"
                onClick={() =>
                  loadFiles([
                    { file: { text: sample, name: "team-overview.csv" } },
                  ])
                }
              >
                Or explore a sample file <ChevronRight size={14} />
              </button>
              <div className="empty-tags">
                <span>CSV & TSV supported</span>
                <span>Up to 50 MB</span>
                <span>100% local</span>
              </div>
            </div>
          ) : (
            <>
              <div className="file-summary">
                <div className="file-icon">
                  <FileSpreadsheet size={25} />
                </div>
                <div>
                  <h2>{name}</h2>
                  <p>
                    {data.rows.length.toLocaleString()} rows <span>·</span>{" "}
                    {data.columns.length} columns <span>·</span>{" "}
                    {data.delimiter === "\t"
                      ? "Tab"
                      : data.delimiter === ";"
                        ? "Semicolon"
                        : "Comma"}{" "}
                    separated
                  </p>
                </div>
                <span className="readonly">READ ONLY</span>
              </div>
              {data.warnings.length > 0 && (
                <div className="warning" role="status">
                  {data.warnings.join(" ")}
                </div>
              )}
              <div className="table-card">
                <div className="toolbar">
                  <div className="search">
                    <Search size={17} />
                    <input
                      aria-label="Search all cells"
                      placeholder="Search across all columns…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                      }}
                    />
                    {search && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="toolbar-actions">
                    <button className="secondary" onClick={reset}>
                      <RotateCcw size={15} />
                      Reset view
                    </button>
                    <button
                      className={`secondary ${columnsOpen ? "selected" : ""}`}
                      onClick={() => setColumnsOpen(!columnsOpen)}
                      aria-expanded={columnsOpen}
                    >
                      <Columns3 size={16} />
                      Columns
                      <span className="count">
                        {visible.length}/{data.columns.length}
                      </span>
                    </button>
                  </div>
                </div>
                {columnsOpen && (
                  <div className="column-panel">
                    <div>
                      <strong>Visible columns</strong>
                      <button
                        className="text-button"
                        onClick={() => setHidden([])}
                      >
                        Show all
                      </button>
                    </div>
                    <div className="column-options">
                      {data.columns.map((column, index) => (
                        <label key={index}>
                          <input
                            type="checkbox"
                            checked={!hidden.includes(index)}
                            onChange={() => toggleColumn(index)}
                          />
                          {column}
                        </label>
                      ))}
                    </div>
                    <p>Filters on hidden columns still apply.</p>
                  </div>
                )}
                <div className="view-info">
                  <span>
                    <Filter size={13} />
                    {activeFilters
                      ? `${activeFilters} column filter${activeFilters === 1 ? "" : "s"} active`
                      : "Filter below any column heading"}
                    {activeFilters > 0 && (
                      <button
                        className="text-button"
                        onClick={() => setFilters({})}
                      >
                        Clear filters
                      </button>
                    )}
                  </span>
                  <span>
                    {sort
                      ? `Sorted by ${data.columns[sort.column]} · ${sort.direction === "asc" ? "ascending" : "descending"}`
                      : "Original row order"}
                  </span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th className="row-number">#</th>
                        {visible.map(({ label, index }) => (
                          <th
                            key={index}
                            aria-sort={
                              sort?.column === index
                                ? sort.direction === "asc"
                                  ? "ascending"
                                  : "descending"
                                : "none"
                            }
                          >
                            <button
                              className="sort-button"
                              aria-label={`Sort by ${label}`}
                              onClick={() => cycleSort(index)}
                            >
                              {label}
                              {sort?.column === index ? (
                                sort.direction === "asc" ? (
                                  <ArrowUp size={14} />
                                ) : (
                                  <ArrowDown size={14} />
                                )
                              ) : (
                                <ArrowUpDown size={14} />
                              )}
                            </button>
                          </th>
                        ))}
                      </tr>
                      <tr className="filter-row">
                        <th className="row-number">
                          <Filter size={12} />
                        </th>
                        {visible.map(({ label, index }) => (
                          <th key={index}>
                            <input
                              aria-label={`Filter ${label}`}
                              placeholder="Filter…"
                              value={filters[index] ?? ""}
                              onChange={(e) => {
                                setFilters({
                                  ...filters,
                                  [index]: e.target.value,
                                });
                                setPage(0);
                              }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .slice(
                          currentPage * PAGE_SIZE,
                          (currentPage + 1) * PAGE_SIZE,
                        )
                        .map(({ cells, index }) => (
                          <tr key={index}>
                            <td className="row-number">{index + 1}</td>
                            {visible.map((c) => (
                              <td key={c.index} title={cells[c.index] ?? ""}>
                                {cells[c.index] || (
                                  <span className="blank">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {rows.length === 0 && (
                    <div className="no-results">
                      <Search size={25} />
                      <h3>No matching rows</h3>
                      <p>Try a different search or clear your filters.</p>
                      <button
                        className="secondary"
                        onClick={() => {
                          setSearch("");
                          setFilters({});
                        }}
                      >
                        Clear search & filters
                      </button>
                    </div>
                  )}
                  {visible.length === 0 && (
                    <div className="no-results">
                      <p>All columns are hidden.</p>
                      <button
                        className="secondary"
                        onClick={() => setHidden([])}
                      >
                        Show all columns
                      </button>
                    </div>
                  )}
                </div>
                <div className="table-footer">
                  <span aria-live="polite">
                    Showing{" "}
                    <strong>
                      {rows.length ? currentPage * PAGE_SIZE + 1 : 0}–
                      {Math.min((currentPage + 1) * PAGE_SIZE, rows.length)}
                    </strong>{" "}
                    of <strong>{rows.length.toLocaleString()}</strong> rows
                    {rows.length !== data.rows.length &&
                      ` (${data.rows.length.toLocaleString()} total)`}
                  </span>
                  <div>
                    <button
                      aria-label="Previous page"
                      disabled={currentPage === 0}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      Page {currentPage + 1} of {maxPage + 1}
                    </span>
                    <button
                      aria-label="Next page"
                      disabled={currentPage >= maxPage}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <p className="hint">
                Tip: click a column heading to sort ascending, descending, or
                return to the original order.
              </p>
            </>
          )}
        </section>
        <footer>
          <span>
            Nebula CSV Viewer <span className="version">v{version}</span>
          </span>
          <span>
            <ShieldCheck size={13} />
            Private by default. Simple by design.
          </span>
        </footer>
      </main>
      {dragging && (
        <div className="drop-overlay">
          <Upload size={44} />
          <h2>Drop your CSV files here</h2>
        </div>
      )}
    </div>
  );
}
