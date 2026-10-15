/**
 * Structured browser logger for shell state changes (NFR-006, observability).
 *
 * Emits one structured record per shell state change — shell mode, viewport
 * class, theme, direction, sidebar state, offline condition — so regressions
 * are diagnosable from the browser console.
 *
 * Hard rule: this logger MUST NOT log credentials, secrets, tokens, provider
 * keys, or sensitive user data (NFR-006). Values are sanitized defensively:
 * any field whose name looks secret-bearing is dropped, and string values that
 * look like secrets are redacted.
 */

/** Shell state-change events the logger knows about. */
export type ShellLogEvent =
  | "shell-mode"
  | "viewport-class"
  | "theme"
  | "direction"
  | "sidebar"
  | "drawer"
  | "offline"
  | "shell-ready"
  | "region-state";

/** A structured log record. */
export interface ShellLogRecord {
  readonly scope: "mahak.shell";
  readonly event: ShellLogEvent;
  readonly fields: Readonly<Record<string, unknown>>;
}

/** Field names that must never be logged (NFR-006). */
const SECRET_FIELD_PATTERNS = [
  /^token$/i,
  /^.*token(s)?$/i,
  /^secret(s)?$/i,
  /^(api[-_]?)?key(s)?$/i,
  /^provider[-_]?(key|secret)$/i,
  /^password$/i,
  /^credential(s)?$/i,
  /^authorization$/i,
  /^cookie$/i,
  /^session[-_]?(id|token)$/i,
];

/** String values that look like secrets (long, high-entropy bearer-style). */
const SECRET_VALUE_PATTERNS = [
  /^(bearer|token|secret|password|key)\s*[:=]/i,
  /^[A-Za-z0-9+/_-]{40,}$/,
];

function isSecretFieldName(name: string): boolean {
  return SECRET_FIELD_PATTERNS.some((pattern) => pattern.test(name));
}

function looksLikeSecretValue(value: unknown): boolean {
  return typeof value === "string" && SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Drop secret-bearing fields and redact secret-looking values. Public for unit
 * testing so the redaction rule itself is covered (NFR-006).
 */
export function sanitizeFields(
  fields: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const clean: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(fields)) {
    if (isSecretFieldName(name)) continue;
    if (looksLikeSecretValue(value)) {
      clean[name] = "[redacted]";
      continue;
    }
    if (value && typeof value === "object") {
      clean[name] = sanitizeFields(value as Record<string, unknown>);
    } else {
      clean[name] = value;
    }
  }

  return clean;
}

type Sink = (record: ShellLogRecord) => void;

/** The active sink. Defaults to the browser console; overridable in tests. */
let sink: Sink = (record) => {
  console.info(`[mahak.shell] ${record.event}`, record.fields);
};

/**
 * Install a custom sink (used by tests to assert emitted records).
 */
export function setLoggerSink(next: Sink): void {
  sink = next;
}

/**
 * Emit one structured shell state-change record.
 */
export function logShellEvent(event: ShellLogEvent, fields: Record<string, unknown> = {}): void {
  const record: ShellLogRecord = {
    scope: "mahak.shell",
    event,
    fields: sanitizeFields(fields),
  };
  sink(record);
}
