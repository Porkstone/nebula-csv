# Nebula CSV Viewer

A local Electron desktop app for exploring CSV files. No account, backend, telemetry, or file uploads.

## Features

- Open CSV, TSV, and delimited text through the Windows file picker, drag and drop, or Ctrl+O.
- Hide and restore columns using the Columns panel.
- Click headings to cycle through ascending, descending, and original row order. Numeric values sort numerically.
- Combine case-insensitive substring filters on individual columns with search across every cell.
- Reset the view without changing the original file. Hidden-column filters remain active.
- Automatic delimiter detection, quoted and multiline fields, UTF-8 BOM support, and warnings for irregular rows.
- 100-row pages, sticky headings, and a 50 MB input limit.
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

The Windows x64 installer is produced in `release/`. The installer is unsigned unless a signing certificate is configured in the build environment.

See [validation notes](docs/TESTING.md) for automated and Windows computer-use test coverage.

## Distribution

GitHub: https://github.com/porkstone/nebula-csv

Chocolatey package ID: `nebula-csv`; display name: **Nebula CSV Viewer**.

Download the [Windows installer](https://github.com/porkstone/nebula-csv/releases/latest). Once the [Chocolatey package](https://community.chocolatey.org/packages/nebula-csv) is approved, install with `choco install nebula-csv`.

The `chocolatey/` directory contains the package metadata and installation script. The installer URL is versioned and verified using SHA-256. Publishing credentials must be supplied separately and must never be committed.

## Security

Electron uses a sandboxed renderer, context isolation, disabled Node integration, a restrictive content security policy, and a narrow preload API exposing only a native file picker. Cell contents render as text, never HTML. New windows, renderer navigation, and permission requests are denied.
