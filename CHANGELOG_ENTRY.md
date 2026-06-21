### Security
*   Fixed an issue where `Config.SECURITY.DNA_SALT` fell back to a hardcoded string `DEVELOPMENT_ONLY_SALT` when the `VITE_DNA_SALT` environment variable was not set. It now dynamically generates a secure local salt using `window.crypto.getRandomValues()` or `crypto.randomBytes()`, and persists it securely via `localStorage.getItem('nadagotchi_dna_salt')`.
