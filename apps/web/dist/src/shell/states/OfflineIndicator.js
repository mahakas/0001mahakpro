import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * OfflineIndicator — detects and indicates an interrupted or unavailable
 * network condition (FR-051).
 *
 * The shell remains structurally intact during the interruption and previously
 * rendered regions stay visible: this is a banner rendered above the frame,
 * not a replacement for region content. A reserved destination selected while
 * offline still presents the unavailable state rather than an error or crash
 * (spec edge case "Reserved destination while offline").
 */
import { useEffect, useState } from "react";
import { useLocale } from "../../providers/LocaleProvider.js";
import { logShellEvent } from "../../logger/index.js";
function readOnline() {
    try {
        return typeof navigator !== "undefined" ? navigator.onLine : true;
    }
    catch {
        return true;
    }
}
export function OfflineIndicator() {
    const { t } = useLocale();
    const [online, setOnline] = useState(() => readOnline());
    useEffect(() => {
        const handleOffline = () => {
            setOnline(false);
            logShellEvent("offline", { online: false });
        };
        const handleOnline = () => {
            setOnline(true);
            logShellEvent("offline", { online: true });
        };
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);
    if (online)
        return null;
    return (_jsxs("div", { className: "shell-state shell-offline-indicator", "data-state": "offline", role: "status", "aria-live": "polite", children: [_jsx("p", { className: "shell-state-title", children: t("state.offline.title") }), _jsx("p", { className: "shell-state-message", children: t("state.offline.message") })] }));
}
