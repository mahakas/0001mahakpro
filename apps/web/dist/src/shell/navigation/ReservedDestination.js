import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ReservedDestination — what a reserved destination renders into the main
 * region (FR-013, FR-050, FR-056).
 *
 * Activating a reserved destination presents the defined unavailable state and
 * MUST NOT imply the feature exists (FR-013). The state is distinct from
 * loading, empty, and error (FR-050).
 *
 * A future module replaces this rendering by flipping its availability entry
 * to `available` and binding its route — the shell regions and navigation
 * contract stay untouched (contracts/navigation.md module extension contract).
 */
import { useNavigation } from "./NavigationRegistry.js";
import { useLocale } from "../../providers/LocaleProvider.js";
import { UnavailableState } from "../states/UnavailableState.js";
export function ReservedDestination({ destinationId, routePath }) {
    const { registry } = useNavigation();
    const { t } = useLocale();
    const destination = destinationId
        ? registry.findById(destinationId)
        : routePath
            ? registry.findByRoutePath(routePath)
            : undefined;
    return (_jsx(UnavailableState, { destinationLabel: destination ? t(destination.labelKey) : undefined }));
}
