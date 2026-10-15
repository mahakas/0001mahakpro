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

export interface ReservedDestinationProps {
  /** Resolve the destination by id (preferred) or by route path. */
  readonly destinationId?: string;
  readonly routePath?: string;
}

export function ReservedDestination({ destinationId, routePath }: ReservedDestinationProps) {
  const { registry } = useNavigation();
  const { t } = useLocale();

  const destination = destinationId
    ? registry.findById(destinationId)
    : routePath
      ? registry.findByRoutePath(routePath)
      : undefined;

  return (
    <UnavailableState destinationLabel={destination ? t(destination.labelKey) : undefined} />
  );
}
