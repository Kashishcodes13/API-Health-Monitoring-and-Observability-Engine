"use client";
/**
 * Adapter over app/actions/services.ts. addService takes FormData; the other actions try plain
 * arguments first and fall back to FormData. Edit ONLY this file if your signatures differ.
 */
import * as raw from "@/app/actions/services";
import { DEFAULT_KEYS, type FieldKeys } from "./service";

export interface ActionResult { ok: boolean; error?: string }

/* eslint-disable @typescript-eslint/no-explicit-any */
type Fn = (...a: any[]) => Promise<any>;

function normalize(res: any): ActionResult {
  if (res && typeof res === "object") {
    if (typeof res.error === "string" && res.error) return { ok: false, error: res.error };
    if (res.ok === false || res.success === false) return { ok: false, error: res.message ?? "Action failed" };
  }
  return { ok: true };
}

function toFormData(fields: Record<string, string | number | boolean>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, String(v));
  return fd;
}

const needsFormData = (e: unknown) => e instanceof Error && /formData|\.get is not a function/i.test(e.message);

async function run(plain: () => Promise<any>, form: () => Promise<any>): Promise<ActionResult> {
  try {
    try {
      return normalize(await plain());
    } catch (e) {
      if (!needsFormData(e)) throw e;
      return normalize(await form());
    }
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

/** FormData uses the field names detected from existing rows, plus common aliases. */
function addServiceForm(input: NewService, keys: FieldKeys) {
  const fd = new FormData();
  const put = (names: string[], v: string) => new Set(names).forEach((n) => fd.set(n, v));
  put([keys.name, "name"], input.name);
  put([keys.url, "url", "endpoint", "endpoint_url"], input.url);
  put([keys.method, "method", "http_method"], input.method);
  put([keys.expected_status, "expected_status", "expected_status_code"], String(input.expected_status));
  if (keys.interval && keys.intervalValue != null) fd.set(keys.interval, String(keys.intervalValue));
  return fd;
}

export async function addServiceAction(input: NewService, keys: FieldKeys = DEFAULT_KEYS): Promise<ActionResult> {
  try {
    return normalize(await (raw.addService as Fn)(addServiceForm(input, keys)));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export const checkNowAction = (id: string) =>
  run(() => (raw.checkNow as Fn)(id), () => (raw.checkNow as Fn)(toFormData({ id })));

export const toggleServiceAction = (id: string, active: boolean) =>
  run(() => (raw.toggleService as Fn)(id, active), () => (raw.toggleService as Fn)(toFormData({ id, is_active: active, active })));

export const deleteServiceAction = (id: string) =>
  run(() => (raw.deleteService as Fn)(id), () => (raw.deleteService as Fn)(toFormData({ id })));
