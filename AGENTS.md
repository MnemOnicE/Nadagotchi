# AI Agent Instructions & Core Directives

**ATTENTION AI AGENT: YOU MUST FOLLOW ALL RULES IN THIS DOCUMENT FOR EVERY TASK.** Failure to adhere to these directives will result in an incomplete task.

---

## Meta-Prompt: Core Task Structure

For any given user request (e.g., adding a feature, fixing a bug), your final output **MUST** include the following components in this order:

1.  **Code Implementation:** The complete, updated contents for all code files (`.js`, `.html`, etc.) required by the user's request.
2.  **Documentation Updates:** The complete, updated contents for both `CHANGELOG.md` and `ROADMAP.md`, reflecting the new changes.
3.  **Bug Report (If Applicable):** If you identified any potential bugs during your work, provide a report formatted according to the template in `BUGS.md`.

---

## I. Standard Workflow

You **MUST** follow this workflow for every task assigned.

1.  **Acknowledge Directives:** Begin by confirming you have read and understood all files in the repository, especially this `AGENTS.md` and the `BUGS.md` file for reporting conventions.
2.  **Plan Execution:** Formulate a plan to address the user's request while adhering to all rules in this document.
3.  **Implement Code:** Write clean, simple, and well-commented code that directly addresses the user's request. You **MUST** follow the style and commenting directives below.
4.  **Identify Potential Bugs:** As you work, if you notice any behavior in the existing code that seems incorrect or contradicts the design documents, you **MUST** make a note of it.
5.  **Update Project Documentation:** After implementing the code, you **MUST** immediately update the `CHANGELOG.md` and `ROADMAP.md` files to reflect your changes. This is not an optional step.
6.  **Self-Correction Check:** Before finalizing your response, you **MUST** review your own work. Ask yourself: "Does my output include all required components from the Meta-Prompt? Have I followed all rules in `AGENTS.md`?" If the answer is no, correct your output before presenting it.

---

## II. Code Quality Directives

* **Commenting is Mandatory:** All new methods, complex logic, or non-obvious lines of code **MUST** be accompanied by clear, concise comments.
    * **Good Comment:** `// Decrease hunger over time based on energy consumption`
    * **Bad Comment:** `// subtract 1 from hunger`
* **JSDoc for Functions:** All new functions or class methods **MUST** include a JSDoc block explaining what the function does, its parameters (`@param`), and what it returns (`@returns`), as seen in the existing `Nadagotchi.js` file.
* **Clarity and Simplicity:** Write code that is easy for a human to understand. Do not use overly complex or clever solutions where a simple one will suffice.

---

## III. Bug Identification & Reporting

* **Your Responsibility:** You are responsible for more than just writing code. You are also the first line of defense against bugs.
* **Identification:** If you encounter behavior that seems incorrect, or if you believe your new code might introduce a potential issue, you **MUST** report it.
* **Reporting Protocol:** At the end of your response, after the code and documentation updates, you **MUST** add a "Bug Report" section. This section **MUST** use the exact markdown template from the `BUGS.md` file to describe the potential issue. This ensures that a human developer can easily track and verify the problem.

---

## IV. Agent Guardrails & Limitations

* **Adhere to Scope:** You **MUST NOT** implement any features or make any changes that were not explicitly requested by the user in the current prompt. Do not add your own ideas or "gold-plate" the solution.
* **Prioritize User Instructions:** If any instruction in this document appears to conflict with a direct order in the user's prompt, the user's prompt takes priority. Your primary goal is to fulfill the user's immediate request.
* **No New Dependencies:** Do not add any new external libraries, frameworks, or dependencies without explicit permission from the user.
