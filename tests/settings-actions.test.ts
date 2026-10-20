import { describe, expect, it, vi } from "vitest";

const { auth, currentUser, ensureUser, upsertUserSettings, updateTag } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    currentUser: vi.fn(),
    ensureUser: vi.fn(async () => {}),
    upsertUserSettings: vi.fn(async () => ({
      language: "en",
      timezone: "UTC",
      themeBase: "neutral",
      themeAccent: "default",
      themeChart: "default",
      themeMode: "system",
    })),
    updateTag: vi.fn(),
  }),
);

vi.mock("@clerk/nextjs/server", () => ({ auth, currentUser }));
vi.mock("next/cache", () => ({ updateTag }));
vi.mock("@/lib/settings", () => ({ ensureUser, upsertUserSettings }));

import { saveSettingsAction } from "@/lib/settings/actions";

// Every server action authenticates and validates its input — the client is
// not trusted. A hand-made request must not be able to store a language or a
// timezone that the app does not support.

function signIn(userId: string | null = "user_123") {
  auth.mockResolvedValue({ userId });
  currentUser.mockResolvedValue({
    id: userId ?? "user_123",
    primaryEmailAddress: { emailAddress: "mhm@example.com" },
    emailAddresses: [{ emailAddress: "mhm@example.com" }],
    firstName: "Mohamed",
    lastName: "Hajji",
    username: "mhmdhajji",
  });
}

describe("saveSettingsAction", () => {
  it("refuses to run without a session", async () => {
    signIn(null);

    await expect(saveSettingsAction({ language: "en" })).rejects.toThrow(
      "Not authenticated.",
    );
    expect(upsertUserSettings).not.toHaveBeenCalled();
  });

  it("rejects an unsupported language", async () => {
    signIn();

    await expect(saveSettingsAction({ language: "fr" })).rejects.toThrow(
      "Unsupported language: fr",
    );
    expect(upsertUserSettings).not.toHaveBeenCalled();
  });

  it("rejects an unsupported timezone", async () => {
    signIn();

    await expect(saveSettingsAction({ timezone: "Not/AZone" })).rejects.toThrow(
      "Unsupported timezone: Not/AZone",
    );
    expect(upsertUserSettings).not.toHaveBeenCalled();
  });

  it("rejects a theme base that has no CSS behind it", async () => {
    signIn();

    await expect(
      saveSettingsAction({ themeBase: "chartreuse" }),
    ).rejects.toThrow("Unsupported theme base: chartreuse");
    expect(upsertUserSettings).not.toHaveBeenCalled();
  });

  it("rejects an unknown accent or chart", async () => {
    signIn();

    await expect(
      saveSettingsAction({ themeAccent: "chartreuse" }),
    ).rejects.toThrow("Unsupported theme accent: chartreuse");
    await expect(
      saveSettingsAction({ themeChart: "chartreuse" }),
    ).rejects.toThrow("Unsupported theme chart: chartreuse");
  });

  it("rejects an unsupported mode", async () => {
    signIn();

    await expect(saveSettingsAction({ themeMode: "dim" })).rejects.toThrow(
      "Unsupported theme mode: dim",
    );
  });

  it("accepts 'default' for the accent and the chart", async () => {
    signIn();

    await expect(
      saveSettingsAction({ themeAccent: "default", themeChart: "default" }),
    ).resolves.toBeDefined();
  });

  it("writes only the fields that were sent", async () => {
    signIn();

    await saveSettingsAction({ language: "zh" });

    expect(upsertUserSettings).toHaveBeenCalledWith("user_123", {
      language: "zh",
    });
  });

  it("mirrors the Clerk account into the users row", async () => {
    signIn();

    await saveSettingsAction({ language: "zh" });

    expect(ensureUser).toHaveBeenCalledWith({
      id: "user_123",
      email: "mhm@example.com",
      displayName: "Mohamed Hajji",
    });
  });

  it("expires the cached settings so the shell re-renders", async () => {
    signIn();

    await saveSettingsAction({ language: "zh" });

    expect(updateTag).toHaveBeenCalledWith("settings:user_123");
  });
});
