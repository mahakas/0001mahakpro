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
function isSecretFieldName(name) {
    return SECRET_FIELD_PATTERNS.some((pattern) => pattern.test(name));
}
function looksLikeSecretValue(value) {
    return typeof value === "string" && SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}
/**
 * Drop secret-bearing fields and redact secret-looking values. Public for unit
 * testing so the redaction rule itself is covered (NFR-006).
 */
export function sanitizeFields(fields) {
    const clean = {};
    for (const [name, value] of Object.entries(fields)) {
        if (isSecretFieldName(name))
            continue;
        if (looksLikeSecretValue(value)) {
            clean[name] = "[redacted]";
            continue;
        }
        if (value && typeof value === "object") {
            clean[name] = sanitizeFields(value);
        }
        else {
            clean[name] = value;
        }
    }
    return clean;
}
/** The active sink. Defaults to the browser console; overridable in tests. */
let sink = (record) => {
    console.info(`[mahak.shell] ${record.event}`, record.fields);
};
/**
 * Install a custom sink (used by tests to assert emitted records).
 */
export function setLoggerSink(next) {
    sink = next;
}
/**
 * Emit one structured shell state-change record.
 */
export function logShellEvent(event, fields = {}) {
    const record = {
        scope: "mahak.shell",
        event,
        fields: sanitizeFields(fields),
    };
    sink(record);
}
