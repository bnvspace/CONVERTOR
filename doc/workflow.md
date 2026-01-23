# Development Workflow

> **Source of Truth**: [tasklist.md](./tasklist.md)
> **Rules**: [vision.md](../vision.md), [conventions.md](../conventions.md)

## 1. Pick a Task
*   Select the next unchecked item in `doc/tasklist.md`.
*   Read the task description and acceptance criteria (Test step).

> **Important**: ALL status updates, reports, and reasoning must be in **Russian**.

## 2. Implementation Cycle
1.  **Code**: Implement the feature following `conventions.md`.
2.  **Verify**: Run the specified **Test** command from the task list.
3.  **Refine**: Fix issues until the test passes.

## 3. Finalize
1.  **Update Status**:
    *   Mark `[x]` in `doc/tasklist.md`.
    *   Update the top status table in `doc/tasklist.md` (if iteration completes).
2.  **Commit**:
    *   `git add .`
    *   `git commit -m "feat: <task name>"`
