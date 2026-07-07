import type { ApiResponse } from "@/types";

/** Generic fetcher for SWR: hits the given URL and unwraps our ApiResponse envelope. */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json: ApiResponse<T> = await res.json();
  if (!json.success || json.data === undefined) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data;
}