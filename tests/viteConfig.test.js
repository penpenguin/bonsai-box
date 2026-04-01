import { describe, expect, it } from "vitest";
import { resolveGitHubPagesBase } from "../vite.config.js";

describe("resolveGitHubPagesBase", () => {
  it("uses root base outside GitHub Actions", () => {
    expect(
      resolveGitHubPagesBase({
        GITHUB_ACTIONS: undefined,
        GITHUB_REPOSITORY: "penpenguin/bonsai-box",
      }),
    ).toBe("/");
  });

  it("uses the repository name as base path on GitHub Actions", () => {
    expect(
      resolveGitHubPagesBase({
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "penpenguin/bonsai-box",
      }),
    ).toBe("/bonsai-box/");
  });

  it("falls back to root if repository metadata is missing", () => {
    expect(
      resolveGitHubPagesBase({
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "",
      }),
    ).toBe("/");
  });
});
