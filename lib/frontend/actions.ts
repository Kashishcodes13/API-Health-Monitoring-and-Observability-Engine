"use client";
/**
 * Thin adapter over app/actions/services.ts so UI components never depend on
 * exact action signatures. If your actions take different arguments (e.g. FormData),
 * change ONLY this file.
 */
import * as raw from "@/app/actions/services";

export interface ActionResult { ok: boolean; error?: string }

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalize(res: any): ActionResult {
  if (res && typeof res === "object") {
    if (typeof res.error === "string" && res.error) return { ok: false, error: res.error };
    if (res.ok === false || res.success === false)
      return { ok: false, error: res.message ?? "Action failed" };
  }
  return { ok: true };
}

async function run(fn: () => Promise<any>): Promise<ActionResult> {
  try {
    return normalize(await fn());
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export interface NewService {
  name: string;
  url: string;
  method: string;
  expected_status: number;
}

export const addServiceAction = (input: NewService) =>
  run(() => (raw.addService as (i: any) => Promise<any>)(input));
export const checkNowAction = (id: string) =>
  run(() => (raw.checkNow as (i: any) => Promise<any>)(id));
export const toggleServiceAction = (id: string, active: boolean) =>
  run(() => (raw.toggleService as (...a: any[]) => Promise<any>)(id, active));
export const deleteServiceAction = (id: string) =>
  run(() => (raw.deleteService as (i: any) => Promise<any>)(id));
