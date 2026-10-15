"""``GET /api/v1/shell`` — the stable shell contract endpoint.

Declares the shell mode, feature availability, and default locale direction
metadata to any client (FR-055, NFR-006). The response MUST NOT contain
credentials, secrets, tokens, provider keys, or any user data.

The path and response shape are stable; later features MAY update only the
carried *values* (for example flipping a ``features`` entry to ``available``)
and MUST NOT introduce business logic into this endpoint
(contracts/api.md, extension rules 1-3).
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter

from ..contracts import shell as contract

router = APIRouter(prefix=contract.API_PREFIX, tags=["shell"])


@router.get("/shell", summary="Declare shell mode, feature availability, and locale direction")
def get_shell() -> Dict[str, Any]:
    """Return the shell contract payload.

    No request parameters and no credentials are accepted. The payload carries
    only presentation metadata — shell mode, the availability map, and the
    locale → direction map — so no privileged data reaches the browser
    (NFR-006).
    """
    return {
        "apiVersion": contract.API_VERSION,
        "shellMode": contract.DEFAULT_SHELL_MODE,
        "features": dict(contract.R01_FEATURE_AVAILABILITY),
        "locales": {
            "supported": list(contract.SUPPORTED_LOCALES),
            "direction": dict(contract.LOCALE_DIRECTION_MAP),
        },
    }
