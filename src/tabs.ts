import type { Dataset, Sort } from "./csv";

export type TabView = {
  hidden: number[];
  filters: Record<number, string>;
  sort: Sort;
  search: string;
  page: number;
  columnsOpen: boolean;
};
export type CsvTab = { id: string; name: string; data: Dataset; view: TabView };
export type Workspace = { tabs: CsvTab[]; activeId: string | null };
export type TabAction =
  | { type: "open"; tabs: CsvTab[] }
  | { type: "activate"; id: string }
  | { type: "close"; id: string }
  | { type: "update"; id: string; view: Partial<TabView> }
  | { type: "reset"; id: string };

export function emptyView(): TabView {
  return {
    hidden: [],
    filters: {},
    sort: null,
    search: "",
    page: 0,
    columnsOpen: false,
  };
}
export const emptyWorkspace: Workspace = { tabs: [], activeId: null };

export function tabsReducer(state: Workspace, action: TabAction): Workspace {
  switch (action.type) {
    case "open":
      return action.tabs.length
        ? {
            tabs: [...state.tabs, ...action.tabs],
            activeId: action.tabs.at(-1)!.id,
          }
        : state;
    case "activate":
      return state.tabs.some((tab) => tab.id === action.id)
        ? { ...state, activeId: action.id }
        : state;
    case "close": {
      const index = state.tabs.findIndex((tab) => tab.id === action.id);
      if (index < 0) return state;
      const tabs = state.tabs.filter((tab) => tab.id !== action.id);
      return {
        tabs,
        activeId:
          state.activeId === action.id
            ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? null)
            : state.activeId,
      };
    }
    case "update":
    case "reset":
      return {
        ...state,
        tabs: state.tabs.map((tab) =>
          tab.id === action.id
            ? {
                ...tab,
                view:
                  action.type === "reset"
                    ? emptyView()
                    : { ...tab.view, ...action.view },
              }
            : tab,
        ),
      };
  }
}
