import { z } from "zod/v4";
import { isCompatibleType, isSameType } from "../src/zod4/index.ts";
import type { CompareContext } from "../src/zod4/types.ts";
import { zodToString } from "../src/zod4/utils.ts";

const schemaAInput = document.getElementById("schemaA") as HTMLTextAreaElement;
const schemaBInput = document.getElementById("schemaB") as HTMLTextAreaElement;
const compareBtn = document.getElementById("compareBtn") as HTMLButtonElement;
const isSameTypeResult = document.getElementById(
  "isSameTypeResult",
) as HTMLSpanElement;
const isCompatibleTypeResult = document.getElementById(
  "isCompatibleTypeResult",
) as HTMLSpanElement;
const debugDiv = document.getElementById("debug") as HTMLDivElement;
const errorDiv = document.getElementById("error") as HTMLDivElement;

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

function compare() {
  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.style.display = "none";
  }
  if (debugDiv) debugDiv.textContent = "";
  if (isSameTypeResult) {
    isSameTypeResult.textContent = "-";
    isSameTypeResult.className = "";
  }
  if (isCompatibleTypeResult) {
    isCompatibleTypeResult.textContent = "-";
    isCompatibleTypeResult.className = "";
  }

  try {
    const codeA = schemaAInput.value;
    const codeB = schemaBInput.value;

    const schemaA = evaluateSchema(codeA);
    const schemaB = evaluateSchema(codeB);

    const context: CompareContext = { stacks: [] };
    const same = isSameType(schemaA, schemaB, context);
    console.log("isSameType:", same);
    console.log("Context:", context);
    if (isSameTypeResult) {
      isSameTypeResult.textContent = same.toString();
      isSameTypeResult.className = same ? "true" : "false";
    }

    if (!same && context.stacks && context.stacks.length > 0 && debugDiv) {
      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>Rule</th>
            <th>Result</th>
            <th>Target A</th>
            <th>Target B</th>
          </tr>
        </thead>
        <tbody>
          ${context.stacks
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

    const compatible = isCompatibleType(schemaA, schemaB);
    console.log("isCompatibleType:", compatible);
    if (isCompatibleTypeResult) {
      isCompatibleTypeResult.textContent = compatible.toString();
      isCompatibleTypeResult.className = compatible ? "true" : "false";
    }
  } catch (err) {
    if (errorDiv) {
      errorDiv.textContent = (err as Error).message;
      errorDiv.style.display = "block";
    }
  }
}

compareBtn.addEventListener("click", compare);

// Initial compare
compare();

// @ts-expect-error
globalThis.isSameType = isSameType;
// @ts-expect-error
globalThis.isCompatibleType = isCompatibleType;
// @ts-expect-error
globalThis.z = z;
console.log("You can use isSameType in the console");
