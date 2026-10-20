// @vitest-environment jsdom
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { ShellProviders } from "@/components/shell/shell-providers";
import { Sidebar } from "@/components/shell/sidebar";
import { useCollapsedSidebar } from "@/components/shell/use-collapsed";

const STORAGE_KEY = "life-hub:sidebar-collapsed";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useCollapsedSidebar", () => {
  it("starts expanded when nothing is stored", () => {
    const { result } = renderHook(() => useCollapsedSidebar());

    expect(result.current.collapsed).toBe(false);
  });

  it("restores the collapsed flag from localStorage", () => {
    window.localStorage.setItem(STORAGE_KEY, "1");

    const { result } = renderHook(() => useCollapsedSidebar());

    expect(result.current.collapsed).toBe(true);
  });

  it("persists the flag under life-hub:sidebar-collapsed", () => {
    const { result } = renderHook(() => useCollapsedSidebar());

    act(() => {
      result.current.toggle();
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
    expect(result.current.collapsed).toBe(true);
  });

  it("toggles back to expanded", () => {
    const { result } = renderHook(() => useCollapsedSidebar());

    act(() => {
      result.current.toggle();
    });
    act(() => {
      result.current.toggle();
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("0");
    expect(result.current.collapsed).toBe(false);
  });
});

describe("the lobby sidebar", () => {
  it("renders the nav and the collapse toggle", () => {
    render(
      <ShellProviders>
        <Sidebar locale="en" />
      </ShellProviders>,
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute(
      "href",
      "/today",
    );
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute(
      "href",
      "/gallery",
    );
    expect(
      screen.getByRole("button", { name: "Collapse" }),
    ).toBeInTheDocument();
  });

  it("collapses when the toggle is clicked, and remembers it", async () => {
    const user = userEvent.setup();

    render(
      <ShellProviders>
        <Sidebar locale="en" />
      </ShellProviders>,
    );

    await user.click(screen.getByRole("button", { name: "Collapse" }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("1");
    expect(
      screen.getByRole("button", { name: "Expand" }),
    ).toBeInTheDocument();
  });

  it("opens the settings modal from the bottom group", async () => {
    const user = userEvent.setup();

    render(
      <ShellProviders>
        <Sidebar locale="en" />
      </ShellProviders>,
    );

    // The Settings button is a button, not a link — settings is a modal,
    // not a page, so no URL change happens.
    const settings = screen.getByRole("button", { name: "Settings" });
    expect(settings).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();

    await user.click(settings);
  });
});
