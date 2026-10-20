// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { saveSettingsAction } = vi.hoisted(() => ({
  saveSettingsAction: vi.fn(async () => ({})),
}));

vi.mock("@/lib/settings/actions", () => ({ saveSettingsAction }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/",
}));

import { ThemeTabContent } from "@/components/shell/settings-tabs/theme-tab-content";

const THEME = {
  base: "neutral",
  accent: "default",
  chart: "default",
  modePref: "system" as const,
};

beforeEach(() => {
  saveSettingsAction.mockClear();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-base");
  document.documentElement.removeAttribute("data-accent");
  document.documentElement.removeAttribute("data-chart");
  document.documentElement.removeAttribute("data-mode");
});

describe("the theme tab", () => {
  it("does NOT persist anything when it mounts", () => {
    // This is the invariant from AGENTS.md: only an EXPLICIT user action may
    // write the account-wide theme. If mounting persisted, a device with a
    // stale local theme would overwrite the account default on every visit.
    render(<ThemeTabContent theme={THEME} />);

    expect(saveSettingsAction).not.toHaveBeenCalled();
  });

  it("persists the mode when the user picks one", async () => {
    const user = userEvent.setup();

    render(<ThemeTabContent theme={THEME} />);

    await user.click(screen.getByRole("radio", { name: /dark/i }));

    await waitFor(() => {
      expect(saveSettingsAction).toHaveBeenCalledWith(
        expect.objectContaining({ themeMode: "dark" }),
      );
    });
  });

  it("writes the choice to localStorage for this device", async () => {
    const user = userEvent.setup();

    render(<ThemeTabContent theme={THEME} />);

    await user.click(screen.getByRole("radio", { name: /dark/i }));

    await waitFor(() => {
      const stored = window.localStorage.getItem("life-hub:theme");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored as string).modePref).toBe("dark");
    });
  });

  it("applies the choice to the document", async () => {
    const user = userEvent.setup();

    render(<ThemeTabContent theme={THEME} />);

    await user.click(screen.getByRole("radio", { name: /dark/i }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-mode")).toBe("dark");
    });
  });

  it("marks the active mode as selected", () => {
    render(<ThemeTabContent theme={THEME} />);

    expect(screen.getByRole("radio", { name: /system/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /dark/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("resets to the defaults", async () => {
    const user = userEvent.setup();

    render(<ThemeTabContent theme={THEME} />);

    await user.click(screen.getByRole("radio", { name: /dark/i }));
    await waitFor(() => expect(saveSettingsAction).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /reset/i }));

    await waitFor(() => {
      expect(saveSettingsAction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          themeBase: "neutral",
          themeAccent: "default",
          themeChart: "default",
          themeMode: "system",
        }),
      );
    });
  });
});
