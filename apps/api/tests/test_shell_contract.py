"""Contract tests for ``GET /api/v1/shell``.

Asserts the response shape and values against ``specs/001-platform-app-shell/
contracts/api.md`` and that no credential or secret field is present
(FR-055, NFR-005).
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from mahak_api.main import app

client = TestClient(app)

# Fields a shell contract response MUST NOT carry (NFR-006).
FORBIDDEN_FIELDS = (
    "token",
    "tokens",
    "access_token",
    "refresh_token",
    "secret",
    "secrets",
    "api_key",
    "apikey",
    "api_keys",
    "provider_key",
    "password",
    "credential",
    "credentials",
    "session",
    "sessionId",
    "user",
    "userId",
    "email",
    "role",
    "roles",
    "permission",
    "permissions",
)

EXPECTED_FEATURE_KEYS = (
    "GENERAL_CHAT",
    "CONVERSATIONS",
    "PROJECTS",
    "PRIVATE_TEACHER",
    "FILES",
    "SEARCH",
    "SETTINGS",
    "ADMIN_CONTROL_CENTER",
)


def test_shell_endpoint_returns_200_and_json() -> None:
    response = client.get("/api/v1/shell")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"


def test_shell_response_has_the_stable_top_level_shape() -> None:
    response = client.get("/api/v1/shell")
    body = response.json()

    assert set(body.keys()) == {"apiVersion", "shellMode", "features", "locales"}
    assert body["apiVersion"] == "v1"


def test_shell_mode_is_exactly_public_or_authenticated() -> None:
    body = client.get("/api/v1/shell").json()

    assert body["shellMode"] in ("public", "authenticated")
    # R01 resolves `public` as the default (contracts/shell-mode.md).
    assert body["shellMode"] == "public"


def test_features_are_exactly_the_eight_reserved_modules() -> None:
    body = client.get("/api/v1/shell").json()
    features = body["features"]

    assert set(features.keys()) == set(EXPECTED_FEATURE_KEYS)
    assert all(value == "reserved" for value in features.values())


def test_locales_declare_supported_set_and_direction_map() -> None:
    body = client.get("/api/v1/shell").json()
    locales = body["locales"]

    assert locales["supported"] == ["fa", "ar", "en"]
    assert locales["direction"] == {"fa": "rtl", "ar": "rtl", "en": "ltr"}


def test_response_contains_no_credentials_or_secrets() -> None:
    """The whole payload — recursively — must be free of secret fields."""
    body = client.get("/api/v1/shell").json()

    def _scan(node: object, path: str = "$") -> None:
        if isinstance(node, dict):
            for key, value in node.items():
                assert key not in FORBIDDEN_FIELDS, f"secret-like field at {path}.{key}"
                _scan(value, f"{path}.{key}")
        elif isinstance(node, list):
            for index, value in enumerate(node):
                _scan(value, f"{path}[{index}]")
        elif isinstance(node, str):
            lowered = node.lower()
            for term in ("secret", "token", "api-key", "api_key", "password", "credential"):
                    assert term not in lowered, f"secret-like value at {path}: {node!r}"

    _scan(body)


def test_shell_endpoint_accepts_no_parameters() -> None:
    # Query params are ignored rather than required; the contract takes none.
    response = client.get("/api/v1/shell", params={})
    assert response.status_code == 200


def test_endpoint_path_is_versioned_and_stable() -> None:
    # The versioned prefix is part of the stable contract (contracts/api.md).
    response = client.get("/api/v1/shell")
    assert response.status_code == 200

    # An unversioned path is NOT part of the R01 contract.
    missing = client.get("/shell")
    assert missing.status_code == 404
