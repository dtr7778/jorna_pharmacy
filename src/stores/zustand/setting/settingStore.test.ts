import { beforeEach, describe, expect, it } from "vitest";

import { useSettingStore } from "./settingStore";

const STORAGE_KEY = "dashboard-settings";

function resetStore() {
  useSettingStore.setState({
    notification: { promptDismissed: false },
    sidebar: { open: true },
  });
  useSettingStore.persist.clearStorage();
}

describe("useSettingStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  it("defaults promptDismissed to false", () => {
    expect(useSettingStore.getState().notification.promptDismissed).toBe(false);
  });

  it("dismissNotificationPrompt sets the flag to true", () => {
    useSettingStore.getState().dismissNotificationPrompt();

    expect(useSettingStore.getState().notification.promptDismissed).toBe(true);
  });

  it("resetNotificationPrompt clears the flag", () => {
    useSettingStore.getState().dismissNotificationPrompt();
    useSettingStore.getState().resetNotificationPrompt();

    expect(useSettingStore.getState().notification.promptDismissed).toBe(false);
  });

  it("defaults the sidebar to open", () => {
    expect(useSettingStore.getState().sidebar.open).toBe(true);
  });

  it("setSidebarOpen sets the open state", () => {
    useSettingStore.getState().setSidebarOpen(false);

    expect(useSettingStore.getState().sidebar.open).toBe(false);
  });

  it("toggleSidebarOpen flips the open state", () => {
    useSettingStore.getState().toggleSidebarOpen();
    expect(useSettingStore.getState().sidebar.open).toBe(false);

    useSettingStore.getState().toggleSidebarOpen();
    expect(useSettingStore.getState().sidebar.open).toBe(true);
  });

  it("persists the state under the dashboard-settings key", () => {
    useSettingStore.getState().dismissNotificationPrompt();
    useSettingStore.getState().setSidebarOpen(false);

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "{}")).toMatchObject({
      version: 0,
      state: {
        notification: { promptDismissed: true },
        sidebar: { open: false },
      },
    });
  });
});
