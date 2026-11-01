"use client";
/**
 * Recharts is a large library. Loading it on demand lets every page paint first;
 * the charts fill in right after (with a skeleton in the meantime).
 */
import dynamic from "next/dynamic";

const Box = ({ h }: { h: string }) => <div className={`skeleton ${h}`} />;

export const FleetChart = dynamic(() => import("./Charts").then((m) => m.FleetChart), { ssr: false, loading: () => <Box h="h-72" /> });
export const StatusDonut = dynamic(() => import("./Charts").then((m) => m.StatusDonut), { ssr: false, loading: () => <Box h="h-72" /> });
export const LatencyChart = dynamic(() => import("./Charts").then((m) => m.LatencyChart), { ssr: false, loading: () => <Box h="h-72" /> });
export const DistributionChart = dynamic(() => import("./Charts").then((m) => m.DistributionChart), { ssr: false, loading: () => <Box h="h-72" /> });
