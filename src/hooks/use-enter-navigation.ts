"use client";

import { useEffect } from "react";

// Enter moves focus to the next field, like Tab, on every form in the app.
// On the last field it submits: a <form> is submitted, otherwise the
// container's [data-enter-submit] button is clicked.
//
// Scope: fields inside a <form>, a [data-enter-nav] container or a dialog.
// Opt out with data-enter-nav="off" on a field or container. Fields that
// handle Enter themselves (e.preventDefault()) are left alone, as are
// textareas, open dropdowns and table cells (unless the row has data-enter-nav).

const FIELD_SELECTOR = [
    "input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=file])",
    "select",
    "textarea",
    "[contenteditable=true]",
    "[role=combobox]",
    "button[data-enter-field]",
].join(",");

const CONTAINER_SELECTOR = "form, [data-enter-nav]:not([data-enter-nav=off]), [role=dialog]";

const isVisible = (el: HTMLElement) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

const fieldsIn = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).filter(
        (el) =>
            !(el as HTMLInputElement).disabled &&
            !(el as HTMLInputElement).readOnly &&
            el.tabIndex !== -1 &&
            !el.closest("[data-enter-nav=off]") &&
            isVisible(el)
    );

export function useEnterNavigation() {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Enter" || e.defaultPrevented || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
            const target = e.target as HTMLElement | null;
            if (!target || !target.matches?.(FIELD_SELECTOR)) return;
            if (target.tagName === "TEXTAREA" || target.closest("[data-enter-nav=off]")) return;
            // Editable table cells save on Enter; a table row only joins in when it opts in with data-enter-nav.
            const table = target.closest("table");
            const optIn = target.closest("[data-enter-nav]");
            if (table && !(optIn && table.contains(optIn))) return;
            if (target.getAttribute("aria-expanded") === "true") return; // let an open dropdown pick its option

            const container = target.closest<HTMLElement>(CONTAINER_SELECTOR);
            if (!container) return;

            const fields = fieldsIn(container);
            const index = fields.indexOf(target);
            if (index === -1) return;
            e.preventDefault();

            const next = fields[index + 1];
            if (next) {
                next.focus();
                if (next instanceof HTMLInputElement && ["text", "number", "email", "tel", "password", "search"].includes(next.type)) {
                    next.select();
                }
                return;
            }

            const submit = container.querySelector<HTMLButtonElement>("[data-enter-submit]");
            if (submit && !submit.disabled) submit.click();
            else if (container instanceof HTMLFormElement) container.requestSubmit();
        };
        // Bubble phase on document: React handlers (which run first) can preventDefault to opt out.
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);
}
