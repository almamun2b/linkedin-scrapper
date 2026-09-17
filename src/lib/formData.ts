/**
 * `FormData#get` returns `FormDataEntryValue | null` — a plain `File` for a file input, not just
 * `string | null`. `String(...)`-ing that unconditionally risks the default `[object File]`
 * stringification instead of a validation error, so every Server Action narrows through here.
 */
export function formString(formData: FormData, key: string, fallback = ""): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}
