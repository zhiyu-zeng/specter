const W = window as unknown as Record<string, unknown>;

/** Retrieve a dynamically-set global value by key, typed via the generic parameter. */
export function getGlobal<T = unknown>(key: string): T | undefined {
  return W[key] as T | undefined;
}

/** Store a value on window under a dynamic key (used for KernelSU callback names). */
export function setGlobal(key: string, value: unknown): void {
  W[key] = value;
}

/** Remove a dynamically-set global by key. */
export function deleteGlobal(key: string): void {
  delete W[key];
}
