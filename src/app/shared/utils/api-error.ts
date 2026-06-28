export function apiErrorMessage(err: unknown, fallback: string): string {
    return (err as { error?: { error?: { message?: string } } })?.error?.error?.message ?? fallback;
}
