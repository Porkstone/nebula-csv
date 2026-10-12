# Nebula CSV Viewer

A local Electron desktop app for exploring CSV files. No account, backend, telemetry, or file uploads.

## Features

- Open multiple CSV, TSV, and delimited text files in separate tabs through the Windows file picker, drag and drop, or Ctrl+O.
- Each tab keeps its own sorting, column visibility, filters, search, and page. Close tabs with the × button or Ctrl+W; switch with Ctrl+Tab or Ctrl+Shift+Tab. Arrow keys, Home, and End navigate the focused tab strip.
- Open CSV files from Windows Explorer using **Open with → nebula-csv**, including when the viewer is already running.
- Hide and restore columns using the Columns panel.
- Click headings to cycle through ascending, descending, and original row order. Numeric values sort numerically.
- Combine case-insensitive substring filters on individual columns with search across every cell.
- Reset the view without changing the original file. Hidden-column filters remain active.
- Automatic delimiter detection, quoted and multiline fields, UTF-8 BOM support, and warnings for irregular rows.
- 100-row pages, sticky headings, and a 50 MB limit per file.
- Light, Dark, and System appearance modes with a saved preference, using the Nebula Applications brand guide (edition 1.1).

The first nonempty row is treated as the header. Text files should use UTF-8. Parsing and filtering occur in memory; the app is intended for previews, not very large datasets. Dates sort as text. Files are read-only.

## Development

Requires Node.js 22.12+ and pnpm.

```sh
pnpm install
pnpm dev:electron
```

```sh
pnpm test
pnpm build
pnpm start
pnpm dist:win
```

The Windows x64 installer is produced as `release/nebula-csv-viewer.exe`. The installed application is also named `nebula-csv-viewer.exe`. The installer is unsigned unless a signing certificate is configured in the build environment.

See [validation notes](docs/TESTING.md) for automated and Windows computer-use test coverage.

## Distribution

GitHub: https://github.com/porkstone/nebula-csv

Chocolatey package ID: `nebula-csv`; display name: **Nebula CSV Viewer**.

Download the [Windows installer](https://github.com/porkstone/nebula-csv/releases/latest). Once the [Chocolatey package](https://community.chocolatey.org/packages/nebula-csv) is approved, install with `choco install nebula-csv`.

After installation, right-click a `.csv` file and select **Open with → nebula-csv**. Windows 11 also offers **Show more options → Open with nebula-csv**. Opening another file brings the existing viewer forward and adds a tab, preserving the other previews. Select several files in Open CSV or drop them together to create several tabs. Tabs last for the current session; closing a tab never changes its source file. The installer leaves your default CSV application unchanged; uninstalling removes Nebula's menu entries.

The `chocolatey/` directory contains the package metadata and installation script. The installer URL is versioned and verified using SHA-256. Publishing credentials must be supplied separately and must never be committed.

## Security

Electron uses a sandboxed renderer, context isolation, disabled Node integration, a restrictive content security policy, and a narrow preload API for the native file picker, file-open events, and appearance preference. Cell contents render as text, never HTML. New windows, renderer navigation, and permission requests are denied.
