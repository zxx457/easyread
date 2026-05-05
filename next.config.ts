import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import BreadcrumbGenerator from "nextjs-dynamic-breadcrumbs/generator";

function generateBreadCrumbs(phase: string, path: string) {
  // Run only in dev phase to avoid watcher-related EMFILE in lint/build.
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    // Prevent duplicate execution when Next.js reloads config multiple times
    if (process.env.__BREADCRUMBS_GENERATED__) return;
    const generator = new BreadcrumbGenerator(path);
    // Remove previously generated breadcrumb files to ensure a clean state
    generator.clean();
    // Generate new breadcrumb files (and watch for changes)
    generator.start();
    // Mark as executed so this runs only once per process
    process.env.__BREADCRUMBS_GENERATED__ = "true";
  }
}

export default (phase: string): NextConfig => {
  generateBreadCrumbs(phase, "src/app/(dashboard)");

  return {
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_BASE_URL ?? "http://localhost:5050",
    },
  };
};
