/**
 * The generic module-binding registry for the extension seam (FR-014, FR-053,
 * FR-056). Kept in its own module so reserved slots import it directly and no
 * import cycle is created with `features/index.ts`.
 *
 * R01 registers no module implementation — every binding is `reserved`.
 */
const bindings = new Map();
/**
 * Register (or replace) a module binding. Called by a future module's reserved
 * slot when it ships — never by the shell.
 */
export function defineModuleBinding(binding) {
    bindings.set(binding.moduleId, binding);
}
/** Look up the binding for a reserved module identity. */
export function getModuleBinding(moduleId) {
    return bindings.get(moduleId);
}
/** Every registered binding (tests and tooling). */
export function listModuleBindings() {
    return Array.from(bindings.values());
}
/** True when a module identity has been bound and marked available. */
export function isModuleAvailable(moduleId) {
    return bindings.get(moduleId)?.availability === "available";
}
