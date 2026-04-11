import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import BreadcrumbGenerator from "nextjs-dynamic-breadcrumbs/generator";

function generateBreadCrumbs(phase: string, path: string) {
  // Run only in dev or build phases
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
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
      BACKEND_BASE_URL: process.env.BACKEND_BASE_URL ?? "http://134.115.205.55:5050",
    },
  };
};
