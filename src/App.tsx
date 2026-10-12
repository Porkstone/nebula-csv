import { useEffect, useMemo, useRef, useState } from "react";
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
import type { Dataset, Sort } from "./csv";
declare global {
  interface Window {
    nebula?: {
      openFile: () => Promise<{ name: string; text: string } | null>;
      setTheme: (theme: string) => void;
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
  const [data, setData] = useState<Dataset | null>(null);
  const [name, setName] = useState("");
  const [hidden, setHidden] = useState<number[]>([]);
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [sort, setSort] = useState<Sort>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  function reset() {
    setHidden([]);
    setFilters({});
    setSort(null);
    setSearch("");
    setPage(0);
  }
  function load(text: string, filename: string) {
    try {
      const result = parseCsv(text);
      setData(result);
      setName(filename);
      reset();
      setError("");
      setColumnsOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this CSV.");
    }
  }
  async function readFile(file?: File) {
    if (!file) return;
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setError("Choose a .csv, .tsv, or .txt file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError(
        "This file exceeds the 50 MB preview limit. Please choose a smaller file.",
      );
      return;
    }
    setBusy(true);
    try {
      load(await file.text(), file.name);
    } catch {
      setError("The file could not be read. Please try again.");
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
      const file = await window.nebula.openFile();
      if (file) load(file.text, file.name);
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
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        void openFile();
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
    setHidden((old) =>
      old.includes(index) ? old.filter((i) => i !== index) : [...old, index],
    );
  }
  function cycleSort(column: number) {
    setSort((old) =>
      old?.column === column
        ? old.direction === "asc"
          ? { column, direction: "desc" }
          : null
        : { column, direction: "asc" },
    );
    setPage(0);
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
        void readFile(e.dataTransfer.files[0]);
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
        </header>
        <section className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">LOCAL WORKSPACE</div>
              <h1>CSV preview</h1>
              <p>Sort, filter, and focus on the columns you need.</p>
            </div>
            <button
              className="primary"
              onClick={() => void openFile()}
              disabled={busy}
            >
              <FolderOpen size={18} />
              {busy ? "Opening…" : "Open CSV"}
              <kbd>Ctrl O</kbd>
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            aria-label="Choose CSV file"
            onChange={(e) => {
              void readFile(e.target.files?.[0]);
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
                Drop a CSV file here to get started.
                <br />
                Sort, filter, and focus on the columns you need.
              </p>
              <button className="primary" onClick={() => void openFile()}>
                <Upload size={17} /> Choose a file
              </button>
              <button
                className="sample-link"
                onClick={() => load(sample, "team-overview.csv")}
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
          <h2>Drop your CSV here</h2>
        </div>
      )}
    </div>
  );
}
