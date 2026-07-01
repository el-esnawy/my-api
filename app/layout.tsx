import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "my-api — Custom REST Endpoints",
  description:
    "Define your own data schemas, generate REST endpoints, and query them from anywhere with per-account access tokens.",
};

export { default } from "@/components/templates/root";
