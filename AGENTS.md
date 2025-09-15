# AGENTS.md

This document provides instructions for AI agents working on this repository.

## Getting Started

1.  **Explore the codebase:** Before making any changes, thoroughly explore the codebase to understand its structure and conventions. Use tools like `ls -R` to get a complete overview.
2.  **Read all documentation:** Carefully review all documentation files, including this one, as well as `README.md`, `ROADMAP.md`, `CHANGELOG.md`, and `BUGS.md`.
3.  **Formulate a plan:** After exploring the codebase and documentation, create a detailed plan for your work using the `set_plan` tool. Your plan should be broken down into clear, actionable steps.

## Development Process

*   **Follow the plan:** Adhere to the plan you've created. If you need to deviate from it, update the plan using `set_plan` and inform the user of the changes.
*   **Verify your changes:** After each modification, use read-only tools like `read_file` or `ls` to confirm that your changes were applied correctly.
*   **Do not edit build artifacts:** If you identify a file as a build artifact (e.g., in a `dist` or `build` directory), do not edit it directly. Trace it back to its source and make your changes there.

## Code Style and Best Practices

*   **Consistency is key:** Adhere to the existing code style.
*   **Keep it simple:** Write clear, concise, and easy-to-understand code. Avoid unnecessary complexity.
*   **Don't repeat yourself (DRY):** Avoid duplicating code. Use functions and classes to promote reusability.
*   **Comments:** Write meaningful comments to explain complex logic or non-obvious code.

## Testing

*   **Write tests:** All new features should be accompanied by tests.
*   **Run existing tests:** Before submitting any changes, run all relevant tests to ensure you haven't introduced any regressions.
*   **Address test failures:** If any tests fail, diagnose the root cause and fix the issue before proceeding.
*   **Aim for high test coverage:** Strive to cover all code paths with tests.

## Documentation

*   **Document your code:** Provide clear and comprehensive documentation for all new features, functions, and classes.
*   **Update documentation:** When you make changes, ensure that the corresponding documentation is updated.

## Versioning

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). All notable changes should be documented in `CHANGELOG.md`, following the format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Commit Messages

Follow the conventional commit format for all commit messages:

```
feat: add new feature

A detailed description of the new feature.

BREAKING CHANGE: description of breaking change
```

*   **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
*   **Scope:** A noun describing the section of the codebase the commit changes.
*   **Subject:** A short, imperative-tense description of the change.

## Code Reviews

*   **Request a review:** Before submitting your work, use the `request_code_review` tool to get feedback on your changes. Address any issues raised in the review before submitting.
*   **Be respectful:** Provide constructive and respectful feedback during code reviews.
*   **Be thorough:** Carefully review all changes to ensure they meet the project's standards.

## Final Submission

Once all tests pass and your code has been reviewed, use the `submit` tool to finalize your changes. Provide a clear and descriptive commit message.
