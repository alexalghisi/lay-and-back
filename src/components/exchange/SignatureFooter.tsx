export function SignatureFooter() {
    return (
        <footer className="mt-auto border-t border-border bg-panel/50">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
                <p>
                    Built by{" "}
                    <span className="font-semibold text-text">Alessandro Paolo Alghisi</span> — a study of the
                    exchange betting model.
                </p>
                <a href="mailto:alexaalghisi@gmail.com" className="text-back hover:underline">
                    alexaalghisi@gmail.com
                </a>
            </div>
        </footer>
    );
}
