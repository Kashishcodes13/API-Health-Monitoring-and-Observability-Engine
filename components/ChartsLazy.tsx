"use client";
/** Recharts is large: load it after the page paints, with a skeleton in the meantime. */
import dynamic from "next/dynamic";

const Box = ({ h }: { h: string }) => <div className={`skeleton ${h}`} />;

export const FleetChart = dynamic(() => import("./Charts").then((m) => m.FleetChart), { ssr: false, loading: () => <Box h="h-72" /> });
export const LatencyChart = dynamic(() => import("./Charts").then((m) => m.LatencyChart), { ssr: false, loading: () => <Box h="h-72" /> });
export const DistributionChart = dynamic(() => import("./Charts").then((m) => m.DistributionChart), { ssr: false, loading: () => <Box h="h-72" /> });
