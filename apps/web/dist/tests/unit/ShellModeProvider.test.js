/**
 * T036 — ShellModeProvider: in `public` mode only the sign-in/sign-up entry
 * points and public global actions are presented and no reserved module
 * destination is visible; in `authenticated` mode the eight reserved
 * destinations and the account area are presented (FR-042, FR-043, FR-058).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { renderShell } from "../utils/shell-tree.js";
import { R01_RESERVED_DESTINATIONS } from "@mahak/contracts";
import { clearShellPreferences } from "../../src/providers/ShellPreferences.js";
describe("shell mode is exactly two values (FR-042)", () => {
    beforeEach(() => clearShellPreferences());
    it("exposes no third mode: public and authenticated only", () => {
        const publicShell = renderShell({ shellMode: "public", width: 1440 });
        expect(publicShell.getByTestId("shell-frame")).toBeInTheDocument();
        publicShell.unmount();
        const authShell = renderShell({ shellMode: "authenticated", width: 1440 });
        expect(authShell.getByTestId("shell-frame")).toBeInTheDocument();
    });
});
describe("public navigation set (FR-058, A-08)", () => {
    beforeEach(() => clearShellPreferences());
    it("presents the sign-in and sign-up entry points as header global actions", () => {
        const { getByTestId } = renderShell({ shellMode: "public", width: 1440 });
        expect(getByTestId("sign-in-entry")).toBeInTheDocument();
        expect(getByTestId("sign-up-entry")).toBeInTheDocument();
    });
    it("presents no reserved module destination", () => {
        const { container } = renderShell({
            shellMode: "public",
            width: 1440,
        });
        // The public navigation set contains zero module destinations (FR-058).
        expect(container.querySelectorAll("[data-destination-id]")).toHaveLength(0);
        expect(container.querySelector('[data-testid="account-entry"]')).toBeNull();
    });
    it("renders no module destination labels anywhere in the public shell", () => {
        const { queryByText } = renderShell({ shellMode: "public", width: 1440 });
        for (const destination of R01_RESERVED_DESTINATIONS) {
            // Destination labels never appear in public mode (FR-058).
            expect(queryByText(new RegExp(destination.labelKey))).not.toBeInTheDocument();
        }
    });
});
describe("authenticated navigation set (FR-043)", () => {
    beforeEach(() => clearShellPreferences());
    it("presents the account area instead of the sign-in entry points", () => {
        const { getByTestId, queryByTestId } = renderShell({
            shellMode: "authenticated",
            width: 1440,
        });
        expect(getByTestId("account-entry")).toBeInTheDocument();
        expect(queryByTestId("sign-in-entry")).not.toBeInTheDocument();
        expect(queryByTestId("sign-up-entry")).not.toBeInTheDocument();
    });
    it("presents all eight reserved destinations in the sidebar", () => {
        const { queryAllByTestId } = renderShell({ shellMode: "authenticated", width: 1440 });
        const links = queryAllByTestId("navigation-list");
        expect(links).toHaveLength(1);
        const items = links[0].querySelectorAll("[data-destination-id]");
        expect(items).toHaveLength(8);
    });
});
