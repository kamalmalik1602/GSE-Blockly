import * as Blockly from 'blockly';
import { defineBlocks } from './blocks';
import { generator } from './generator';


defineBlocks();

const workspace = Blockly.inject('blocklyDiv', {
  toolbox: {
    "kind": "flyoutToolbox",
    "contents": [
   
      { "kind": "block", "type": "rbac_policy" },
      { "kind": "block", "type": "rbac_role" },
      { "kind": "block", "type": "rbac_rule" },
      { "kind": "block", "type": "rbac_resource" }
    ]
  }
});

// show code and errors
const codeOutput = document.getElementById('codeOutput');
const errorOutput = document.getElementById('errorOutput');
const policySelect = document.getElementById('policySelect') as HTMLSelectElement;
const roleSelect = document.getElementById('roleSelect') as HTMLSelectElement;
const actionSelect = document.getElementById('actionSelect') as HTMLSelectElement;
const resourceSelect = document.getElementById('resourceSelect') as HTMLSelectElement;
const evalResult = document.getElementById('evalResult') as HTMLDivElement;

function evaluatePolicyFromGeneratedCode(code: string): 'Allow' | 'Deny' {
  const policyName = policySelect.value;
  const role = roleSelect.value;
  const action = actionSelect.value;
  const resource = resourceSelect.value;

  const runPolicy = new Function(
    'role',
    'action',
    'resource',
    `${code}\nconst result = ${policyName}(role, action, resource);\nreturn result === "Allow" ? "Allow" : "Deny";`,
  ) as (role: string, action: string, resource: string) => 'Allow' | 'Deny';

  return runPolicy(role, action, resource);
}

function updatePolicyOptions() {
  const policies = workspace.getBlocksByType('rbac_policy', false);
  const selectedValue = policySelect.value;
  policySelect.innerHTML = '';

  // add an option for each policy block in the workspace
  policies.forEach((policyBlock, index) => {
    const option = document.createElement('option');
    option.value = policyBlock.getFieldValue('NAME') || `Policy${index + 1}`;
    const name = policyBlock.getFieldValue('NAME') || `Policy ${index + 1}`;
    option.textContent = name;
    policySelect.appendChild(option);
  });

  // preserve selected value if it still exists
  if ([...policySelect.options].some((option) => option.value === selectedValue)) {
    policySelect.value = selectedValue;
  }
}

function runEvaluation() {
  try {
  const code = generator.workspaceToCode(workspace);
    const result = evaluatePolicyFromGeneratedCode(code);
    evalResult.textContent = `Result: ${result}`;
  } catch (e) {
    evalResult.textContent = `Result: error (${e instanceof Error ? e.message : String(e)})`;
  }
}

// generate code whenever the workspace changes
function generateCode() {
  try {
    const code = generator.workspaceToCode(workspace);
    if (codeOutput) codeOutput.textContent = code;
    evalResult.textContent = `Result: ${evaluatePolicyFromGeneratedCode(code)}`;
    if (errorOutput) errorOutput.textContent = '';
  } catch (e) {
    if (errorOutput) errorOutput.textContent = e instanceof Error ? e.message : String(e);
    evalResult.textContent = `Result: error (${e instanceof Error ? e.message : String(e)})`;
  }
}

// generate code on changes to editor
workspace.addChangeListener(() => {
  generateCode();
  updatePolicyOptions();
  runEvaluation();
});

policySelect?.addEventListener('change', runEvaluation);
roleSelect?.addEventListener('change', runEvaluation);
actionSelect?.addEventListener('change', runEvaluation);
resourceSelect?.addEventListener('change', runEvaluation);
