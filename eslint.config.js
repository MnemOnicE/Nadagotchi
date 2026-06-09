import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                // Browser
                window: "readonly",
                document: "readonly",
                console: "readonly",
                localStorage: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                navigator: "readonly",
                fetch: "readonly",
                AudioContext: "readonly",
                webkitAudioContext: "readonly",
                performance: "readonly",
                queueMicrotask: "readonly",
                btoa: "readonly",
                atob: "readonly",
                TextEncoder: "readonly",

                // Phaser
                Phaser: "readonly",

                // Node/Jest
                module: "readonly",
                require: "readonly",
                process: "readonly",
                __dirname: "readonly",
                describe: "readonly",
                it: "readonly",
                test: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                jest: "readonly",
                global: "readonly",
                Buffer: "readonly",

                // Service Worker
                self: "readonly",
                caches: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-dupe-keys": "error"
        }
    }
];
