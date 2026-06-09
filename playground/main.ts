import { z } from "zod/v4";
import { isCompatibleType, isSameType } from "../src/zod4/index.ts";
import type { CompareContext } from "../src/zod4/types.ts";
import { zodToString } from "../src/zod4/utils.ts";

const schemaAInput = document.getElementById("schemaA") as HTMLTextAreaElement;
const schemaBInput = document.getElementById("schemaB") as HTMLTextAreaElement;
const compareBtn = document.getElementById("compareBtn") as HTMLButtonElement;
const presetButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-preset]"),
);
const debugTabs = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-debug-target]"),
);
const isSameTypeResult = document.getElementById(
  "isSameTypeResult",
) as HTMLSpanElement;
const isCompatibleTypeResult = document.getElementById(
  "isCompatibleTypeResult",
) as HTMLSpanElement;
const debugDiv = document.getElementById("debug") as HTMLDivElement;
const errorDiv = document.getElementById("error") as HTMLDivElement;

type DebugTarget = "same" | "compatible";

const presets = {
  "object-width": {
    expected: `z.object({
  name: z.string()
})`,
    provided: `z.object({
  name: z.string(),
  other: z.number()
})`,
  },
  optional: {
    expected: `z.string().optional()`,
    provided: `z.string()`,
  },
  union: {
    expected: `z.string().or(z.number())`,
    provided: `z.string()`,
  },
  "enum-literal": {
    expected: `z.enum(["a", "b"])`,
    provided: `z.literal("a")`,
  },
  "record-key": {
    expected: `z.record(z.enum(["a"]), z.string())`,
    provided: `z.record(z.enum(["a", "b"]), z.string())`,
  },
  "tuple-rest": {
    expected: `z.tuple([z.string()]).rest(z.number())`,
    provided: `z.tuple([z.string(), z.number()])`,
  },
} satisfies Record<string, { expected: string; provided: string }>;

type PresetName = keyof typeof presets;

let activeDebugTarget: DebugTarget = "same";
let sameContext: CompareContext = { stacks: [] };
let compatibleContext: CompareContext = { stacks: [] };

function evaluateSchema(code: string) {
  try {
    // Basic safety check - only allow z.something
    // This is a playground, so we use new Function to eval the code
    // We expose 'z' to the function scope
    const fn = new Function("z", `return ${code};`);
    return fn(z);
  } catch (e) {
    throw new Error(`Invalid schema code: ${(e as Error).message}`);
  }
}

function setResult(result: HTMLSpanElement, value: boolean | null) {
  if (value === null) {
    result.textContent = "-";
    result.className = "";
    return;
  }

  result.textContent = value.toString();
  result.className = value ? "true" : "false";
}

function renderDebug() {
  if (!debugDiv) return;
  debugDiv.textContent = "";

  const context =
    activeDebugTarget === "same" ? sameContext : compatibleContext;
  const stacks = context.stacks ?? [];

  if (stacks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "debug-empty";
    empty.textContent = "No debug entries yet.";
    debugDiv.appendChild(empty);
    return;
  }

  const leftLabel = activeDebugTarget === "compatible" ? "Expected" : "Left";
  const rightLabel = activeDebugTarget === "compatible" ? "Provided" : "Right";

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Rule</th>
        <th>Result</th>
        <th>${leftLabel}</th>
        <th>${rightLabel}</th>
      </tr>
    </thead>
    <tbody>
      ${stacks
        .map(
          (s) => `
        <tr class="${s.result ? "pass" : "fail"}">
          <td>${s.name}</td>
          <td>${s.result}</td>
          <td><pre>${zodToString(s.target[0], { format: true })}</pre></td>
          <td><pre>${zodToString(s.target[1], { format: true })}</pre></td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  `;
  debugDiv.appendChild(table);
}

function isPresetName(value: string): value is PresetName {
  return Object.hasOwn(presets, value);
}

function compare() {
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }
  if (debugDiv) debugDiv.textContent = "";
  setResult(isSameTypeResult, null);
  setResult(isCompatibleTypeResult, null);

  try {
    const codeA = schemaAInput.value;
    const codeB = schemaBInput.value;

    const schemaA = evaluateSchema(codeA);
    const schemaB = evaluateSchema(codeB);

    sameContext = { stacks: [] };
    compatibleContext = { stacks: [] };

    const same = isSameType(schemaA, schemaB, sameContext);
    console.log("isSameType:", same);
    console.log("isSameType context:", sameContext);
    setResult(isSameTypeResult, same);

    const compatible = isCompatibleType(schemaA, schemaB, compatibleContext);
    console.log("isCompatibleType:", compatible);
    console.log("isCompatibleType context:", compatibleContext);
    setResult(isCompatibleTypeResult, compatible);
    renderDebug();
  } catch (err) {
    sameContext = { stacks: [] };
    compatibleContext = { stacks: [] };
    renderDebug();
    if (errorDiv) {
      errorDiv.textContent = (err as Error).message;
      errorDiv.style.display = "block";
    }
  }
}

compareBtn.addEventListener("click", compare);

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    const presetName = button.dataset.preset;
    if (!presetName || !isPresetName(presetName)) return;
    const preset = presets[presetName];
    schemaAInput.value = preset.expected;
    schemaBInput.value = preset.provided;
  });
}

for (const tab of debugTabs) {
  tab.addEventListener("click", () => {
    const target = tab.dataset.debugTarget;
    if (target !== "same" && target !== "compatible") return;
    activeDebugTarget = target;

    for (const item of debugTabs) {
      const selected = item.dataset.debugTarget === target;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", selected.toString());
    }

    renderDebug();
  });
}

// Initial compare
compare();

// @ts-expect-error
globalThis.isSameType = isSameType;
// @ts-expect-error
globalThis.isCompatibleType = isCompatibleType;
// @ts-expect-error
globalThis.z = z;
console.log("You can use isSameType, isCompatibleType, and z in the console");
