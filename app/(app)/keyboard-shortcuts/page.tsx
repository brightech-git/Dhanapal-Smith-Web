"use client";

import ProtectedRoute from "@/src/components/app-shell/protected-route";
import KeyboardShortcutsPage from "@/src/module/shortcuts/keyboard-shortcuts-page";

// Keyboard shortcuts: every signed-in user can see and change their keys (F1 opens it).
export default function KeyboardShortcutsRoute() {
    return (
        <ProtectedRoute>
            <KeyboardShortcutsPage />
        </ProtectedRoute>
    );
}
