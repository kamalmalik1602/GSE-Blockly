#### 💯Points: ![Points bar](../../blob/badges/.github/badges/points-bar.svg)

#### 📝 [Report](../../blob/badges/report.md)

---

# Blockly Assignment

This project is an assignment for assessing the learning of Blockly, a visual programming language. Make sure to initially access this repository via the GitHub Classroom link provided by your instructor (this creates a copy of the repository for you) and follow the instructions below to complete the assignment.

## Learning Blockly Tutorial

Before you start working on the assignment make sure that you have completed the [Blockly tutorial of the lecture](https://se-buw.de/teaching/gse/tutorials/blockly/). It covers the definition of new blocks and the implementation and modification of code generators. 

Your implementation must follow the structure and style of the tutorial! 

## Application Domain: Social Media Moderation (RBAC)

In modern software architecture, managing who has access to what is known as **Role-Based Access Control (RBAC)**. Cloud providers use strict declarative JSON documents to define these security policies. 

Writing these policies by hand is dangerous. A single typo can expose sensitive data. In this exercise, you will build a visual Domain Specific Language (DSL) with Blockly that models these rules. Then, you will write a JavaScript code generator that compiles the visual blocks into JavaScript, allowing us to automatically evaluate the policies for a given scenario.

## The Language Structure (Domain Model)

Our RBAC DSL allows users to visually define an **Access Policy**.
Every Policy has a *name* and contains two lists:

1. **Roles:** Which roles are governed by this policy?
  *(Values: `TrustandSafetyLead`, `Moderator`, `User`)*
2. **Rules:** What permissions are granted or denied for those roles?

Each Rule contains:

1. **Effect:** Grant or deny access.
  *(Values: `Allow`, `Deny`)*
2. **Action:** Operation to check.
  *(Values: `Ban`, `Flag`, `Post`)*
3. **Resources:** A list of resources this rule applies to.
  *(Values: `UserAccounts`, `ReportedContent`, `PublicTimeline`)*

Evaluation follows this behavior:

1. If the role is not listed in the policy roles, the result is `Deny`.
2. Rules are checked for matching action and resource.
3. If no rule matches, the default result is `Deny`.

## Example 1: The "SocialMediaModeration" Policy
**The Scenario:** `TrustandSafetyLead` principals may perform `Ban` on `UserAccounts`, but no other access is granted.

**The Declarative JSON Rule:**
```json
{
  "NAME": "SocialMediaModeration",
  "ROLES": ["TrustandSafetyLead"],
  "RULES": [
    {
      "EFFECT": "Allow",
      "ACTION": "Ban",
      "RESOURCES": ["UserAccounts"]
    }
  ]
}
```


## Example 2: The "SecureAccess" Policy
**The Scenario:** `Moderator` and `User` principals are in scope. They may perform `Flag` on `ReportedContent`, but `Post` on `ReportedContent` is explicitly denied.

**The Declarative JSON Rule:**
```json
{
  "NAME": "SecureAccess",
  "ROLES": ["Moderator", "User"],
  "RULES": [
    {
      "EFFECT": "Allow",
      "ACTION": "Flag",
      "RESOURCES": ["ReportedContent"]
    },
    {
      "EFFECT": "Deny",
      "ACTION": "Post",
      "RESOURCES": ["ReportedContent"]
    }
  ]
}
```


## Implementing the Language & Code Generator

To complete this language, you must define the visual blocks and write the JavaScript generator. Follow the style of the tutorials and implement the blocks and generator in the respective files.

### Setup
1. Clone your repository and open it in your code editor.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open `http://localhost:5173` in your browser to see the Blockly editor.

For the blocks use the JSON array format. For the code generator, reuse the JavaScript generator that comes with Blockly.

### Task 1 – Block Definitions

Define all four block types in `src/blocks.ts` using Blockly's declarative JSON array format.

*   **The Policy Block (`rbac_policy`):** A text field `NAME` for the policy name, plus statement inputs `ROLES` and `RULES`.
*   **The Role Block (`rbac_role`):** Previous and next connections (type `rbac_role`), and a dropdown field `ROLE` with values `TrustandSafetyLead`, `Moderator`, `User`.
*   **The Rule Block (`rbac_rule`):** Previous and next connections (type `rbac_rule`), a dropdown `EFFECT` (`Allow`/`Deny`), a dropdown `ACTION` (`Ban`, `Flag`, `Post`), and a statement input `RESOURCES`.
*   **The Resource Block (`rbac_resource`):** Previous and next connections (type `rbac_resource`), and a dropdown field `RES` with values `UserAccounts`, `ReportedContent`, `PublicTimeline`.

### Task 2 – Per-Block Code Generation

Implement `generator.forBlock` for each block type in `src/generator.ts`. Each handler receives a block and must return a code string:

*   **`rbac_role`:** Return the `ROLE` field value as a quoted string, e.g. `"TRUSTANDSAFETYLEAD"`.
*   **`rbac_resource`:** Return the `RES` field value as a quoted string, e.g. `"USERACCOUNTS"`.
*   **`rbac_rule`:** Use `statementToCode` to collect the resource strings into a list. Build a conditional of the form:
    ```js
    if (action === "ACTION" && ["RES1", "RES2", ...].includes(resource)) return "Allow";
    ```
    Use [`Array.prototype.includes`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes) to check resource membership. Return `"Allow"` or `"Deny"` depending on the `EFFECT` field.
*   **`rbac_policy`:** Use `statementToCode` to collect the role strings and the rule conditionals. Wrap everything in a JavaScript function named after the `NAME` field with signature `(role, action, resource)`. The function must first check whether `role` is in the allowed roles list (again using `.includes`), returning `"Deny"` immediately if not. Then emit the rules, followed by a default `return "Deny"` at the end.

