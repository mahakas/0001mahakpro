/**
 * Minimal local type declarations for `jest-axe` (the package ships no types).
 * Only the surface the accessibility suite uses is declared.
 */

declare module "jest-axe" {
  export interface AxeViolation {
    readonly id: string;
    readonly impact?: string | null;
    readonly description: string;
    readonly help: string;
    readonly helpUrl: string;
    readonly nodes: readonly unknown[];
  }

  export interface AxeResults {
    readonly violations: readonly AxeViolation[];
    readonly passes: readonly unknown[];
    readonly incomplete: readonly unknown[];
    readonly inapplicable: readonly unknown[];
  }

  export function axe(
    node: Element | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>;
}
