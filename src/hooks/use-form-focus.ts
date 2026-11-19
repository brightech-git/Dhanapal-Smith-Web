"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Focus the first editable field on mount or after an explicit form reset. */
export function useFormFocus(disabled: boolean) {
    const formRef = useRef<HTMLFormElement>(null);
    const [request, setRequest] = useState(0);
    const applied = useRef(-1);
    const focusFirstField = useCallback(() => setRequest((value) => value + 1), []);

    useEffect(() => {
        if (disabled || applied.current === request) return;
        const frame = requestAnimationFrame(() => {
            const input = formRef.current?.querySelector<HTMLInputElement>("input:not(:disabled):not([aria-hidden=true])");
            if (!input) return;
            input.focus();
            applied.current = request;
        });
        return () => cancelAnimationFrame(frame);
    }, [disabled, request]);

    return { formRef, focusFirstField };
}
