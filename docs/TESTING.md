# Validation record

Tested on Windows on 12 October 2026.

## Automated checks

`pnpm test`: 7 tests passed. Covers UTF-8 BOM, quoted commas, escaped quotes, multiline fields, tabs, semicolons, irregular rows, duplicate headers, empty input, header-only input, numeric sorting, source preservation, combined case-insensitive filters, and restoration of original order.

`pnpm build`: TypeScript and Vite production build passed.

## Windows computer-use checks

Tested the actual Electron app using the computer-use plugin and Windows input, not only a browser preview.

- Opened `test-data/qa.csv` through the native file picker.
- Verified four records, quoted values, and multiline field content.
- Verified script-like cell contents display as text.
- Sorted Amount ascending (-1.5, 2, 2, 10) and descending (10, 2, 2, -1.5).
- Filtered City with `LONDON` and confirmed three matching records.
- Hid City, confirmed its filter still applied and the visible-column count changed to 3/4.
- Searched `max` while the City filter remained active and confirmed one record.
- Reset the view and confirmed all columns, all records, and original order returned.
- Inspected light and dark appearance, including visible keyboard focus.
- Restarted the app and confirmed the Dark preference persisted.
- Used Ctrl+O to open `test-data/pagination.csv` (205 rows).
- Verified pages 1–100, 101–200, and 201–205, including the disabled final Next control.
- Verified the bundled sample and revised table sizing at the default window size.

## Release checks

- Windows x64 NSIS installer built successfully and completed a silent machine-wide installation with exit code 0.
- Launched the installed application from Program Files and inspected it with computer-use.
- Installed the generated Chocolatey package locally; it downloaded the published GitHub installer, verified SHA-256, and installed successfully (1/1 packages).
- GitHub Actions validation passed.
- Chocolatey accepted version 1.0.0 with HTTP 201; public listing awaits moderation and approval.

## Version 1.0.1 executable rename

- TypeScript and production build passed with the version read from package metadata.
- Built the Windows app and installer with the filename `nebula-csv-viewer.exe`.
- Computer-use confirmed that the renamed packaged application launches, displays version 1.0.1, and previews the bundled CSV sample.
- The local Chocolatey upgrade from 1.0.0 to 1.0.1 downloaded the renamed GitHub installer, verified SHA-256, and succeeded.
- Verified the installed `nebula-csv-viewer.exe`, removal of the old application executable, and correct Desktop and Start Menu shortcut targets.
- Computer-use confirmed that the upgraded application launches from Program Files and displays version 1.0.1.
- GitHub release 1.0.1 is published. Chocolatey rejected the 1.0.1 community submission with HTTP 403, including through the official push command; community publication remains pending resolution of that rejection.

## Version 1.0.2 introductory section removal

- Production build and Windows installer packaging passed.
- Computer-use confirmed removal of the Local workspace overline, CSV preview title, and introductory description in the empty view and sample CSV view.
- Verified that Open CSV remains available and that the table, pagination controls, and footer fit cleanly at the default window size.
- Local Chocolatey upgrade to 1.0.2 succeeded with a verified installer checksum. Computer-use confirmed the introductory section is absent from the installed application.
- GitHub release 1.0.2 is published and CI passed. Community Chocolatey submission still returns HTTP 403.

## Version 1.0.3 header action

- Production build passed with Open CSV moved into the header beside Appearance.
- Computer-use confirmed the header placement in the empty and sample CSV views.
- Clicking the header action opened the native file picker; cancellation restored the button correctly.
- Verified the table, pagination, and footer at the default window size after removing the separate action row.

## Scope and limitations

Windows x64 is the release target. macOS and Linux installers have not been tested. The native Windows file picker may retain the Windows shell appearance even when the application uses Dark mode. The app does not claim full WCAG certification. The installer is unsigned. Parsing and filtering are in memory, with a 50 MB input limit; maximum-size performance is not benchmarked.
