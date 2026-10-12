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

## Scope and limitations

Windows x64 is the release target. macOS and Linux installers have not been tested. The native Windows file picker may retain the Windows shell appearance even when the application uses Dark mode. The app does not claim full WCAG certification. The installer is unsigned. Parsing and filtering are in memory, with a 50 MB input limit; maximum-size performance is not benchmarked.
