import { defineConfig } from "vite";

export function resolveGitHubPagesBase(env = process.env) {
  if (env.GITHUB_ACTIONS !== "true") {
    return "/";
  }

  const repository = env.GITHUB_REPOSITORY || "";
  const repositoryName = repository.split("/")[1];

  if (!repositoryName) {
    return "/";
  }

  return `/${repositoryName}/`;
}

export default defineConfig({
  base: resolveGitHubPagesBase(),
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
  },
});
