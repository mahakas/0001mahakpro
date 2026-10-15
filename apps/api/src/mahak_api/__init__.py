"""MAHAK Application/API layer (R01).

Holds the API boundary that the constitution's Web-first and API-first
requirement demands. R01 exposes exactly one route — ``GET /api/v1/shell`` —
which declares shell mode, feature availability, and locale direction
metadata. No authentication, no module endpoints, no AI calls (FR-055,
contracts/api.md).
"""

__all__ = ["__version__"]
__version__ = "0.1.0"
