import * as Blockly from 'blockly';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineBlocks } from '../src/blocks';
import { generator } from '../src/generator';

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadFixture(filename: string): Blockly.Workspace {
  const fixturePath = join(process.cwd(), 'tests', 'fixtures', filename);
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  const workspace = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(fixture, workspace);
  return workspace;
}

function runPolicy(
  workspace: Blockly.Workspace,
  policyName: string,
  role: string,
  action: string,
  resource: string,
): string {
  const code = generator.workspaceToCode(workspace);
  if (code.includes('{{')) {
    throw new Error(
      'Generated code still contains {{placeholders}} — the repository has not been customized yet. ' +
      'Run `python automate/setup.py` first, or push to GitHub to trigger the Action.',
    );
  }
  const fn = new Function(
    'role', 'action', 'resource',
    `${code}\nreturn ${policyName}(role, action, resource);`,
  ) as (r: string, a: string, res: string) => string;
  return fn(role, action, resource);
}

// ── Step 1 – Block Definitions ───────────────────────────────────────────────
// Pass these tests first by defining each block type in defineBlocks().

describe('Step 1 – Block Definitions', () => {
  beforeAll(() => { defineBlocks(); });

  it('rbac_role block exists and has a ROLE dropdown field', () => {
    const ws = new Blockly.Workspace();
    let block!: Blockly.Block;
    expect(
      () => { block = ws.newBlock('rbac_role'); },
      'rbac_role block type must be registered inside defineBlocks()',
    ).not.toThrow();
    expect(
      block.getField('ROLE'),
      'rbac_role must declare a field named ROLE (use field_dropdown)',
    ).not.toBeNull();
    ws.dispose();
  });

  it('rbac_role ROLE dropdown includes TRUSTANDSAFETYLEAD, MODERATOR, and USER', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_role');
    for (const value of ['TRUSTANDSAFETYLEAD', 'MODERATOR', 'USER']) {
      block.setFieldValue(value, 'ROLE');
      expect(
        block.getFieldValue('ROLE'),
        `The ROLE dropdown must include the option "${value}"`,
      ).toBe(value);
    }
    ws.dispose();
  });

  it('rbac_resource block exists and has a RES dropdown field', () => {
    const ws = new Blockly.Workspace();
    let block!: Blockly.Block;
    expect(
      () => { block = ws.newBlock('rbac_resource'); },
      'rbac_resource block type must be registered inside defineBlocks()',
    ).not.toThrow();
    expect(
      block.getField('RES'),
      'rbac_resource must declare a field named RES (use field_dropdown)',
    ).not.toBeNull();
    ws.dispose();
  });

  it('rbac_resource RES dropdown includes USERACCOUNTS, REPORTEDCONTENT, and PUBLICTIMELINE', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_resource');
    for (const value of ['USERACCOUNTS', 'REPORTEDCONTENT', 'PUBLICTIMELINE']) {
      block.setFieldValue(value, 'RES');
      expect(
        block.getFieldValue('RES'),
        `The RES dropdown must include the option "${value}"`,
      ).toBe(value);
    }
    ws.dispose();
  });

  it('rbac_rule block exists with EFFECT, ACTION fields and RESOURCES input', () => {
    const ws = new Blockly.Workspace();
    let block!: Blockly.Block;
    expect(
      () => { block = ws.newBlock('rbac_rule'); },
      'rbac_rule block type must be registered inside defineBlocks()',
    ).not.toThrow();
    expect(
      block.getField('EFFECT'),
      'rbac_rule must declare a field named EFFECT (use field_dropdown)',
    ).not.toBeNull();
    expect(
      block.getField('ACTION'),
      'rbac_rule must declare a field named ACTION (use field_dropdown)',
    ).not.toBeNull();
    expect(
      block.getInput('RESOURCES'),
      'rbac_rule must declare a statement input named RESOURCES',
    ).not.toBeNull();
    ws.dispose();
  });

  it('rbac_rule EFFECT accepts ALLOW and DENY; ACTION accepts Ban, Flag, Post', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_rule');
    for (const value of ['ALLOW', 'DENY']) {
      block.setFieldValue(value, 'EFFECT');
      expect(
        block.getFieldValue('EFFECT'),
        `The EFFECT dropdown must include the option "${value}"`,
      ).toBe(value);
    }
    for (const value of ['BAN', 'FLAG', 'POST']) {
      block.setFieldValue(value, 'ACTION');
      expect(
        block.getFieldValue('ACTION'),
        `The ACTION dropdown must include the option "${value}"`,
      ).toBe(value);
    }
    ws.dispose();
  });

  it('rbac_policy block exists with NAME field and ROLES, RULES statement inputs', () => {
    const ws = new Blockly.Workspace();
    let block!: Blockly.Block;
    expect(
      () => { block = ws.newBlock('rbac_policy'); },
      'rbac_policy block type must be registered inside defineBlocks()',
    ).not.toThrow();
    expect(
      block.getField('NAME'),
      'rbac_policy must declare a text field named NAME',
    ).not.toBeNull();
    expect(
      block.getInput('ROLES'),
      'rbac_policy must declare a statement input named ROLES',
    ).not.toBeNull();
    expect(
      block.getInput('RULES'),
      'rbac_policy must declare a statement input named RULES',
    ).not.toBeNull();
    ws.dispose();
  });
});

// ── Step 2 – Per-Block Code Generation ───────────────────────────────────────
// Implement generator.forBlock for each block type to pass these tests.

describe('Step 2 – Per-Block Code Generation', () => {
  beforeAll(() => { defineBlocks(); });

  it('rbac_role generates a quoted string for the selected role', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_role');
    block.setFieldValue('TRUSTANDSAFETYLEAD', 'ROLE');
    generator.init(ws);
    const code = generator.blockToCode(block);
    generator.finish('');
    expect(
      code,
      'generator.forBlock["rbac_role"] must return the ROLE value as a quoted string, e.g. "TRUSTANDSAFETYLEAD"',
    ).toMatch(new RegExp(`["']TRUSTANDSAFETYLEAD["']`));
    ws.dispose();
  });

  it('rbac_resource generates a quoted string for the selected resource', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_resource');
    block.setFieldValue('USERACCOUNTS', 'RES');
    generator.init(ws);
    const code = generator.blockToCode(block);
    generator.finish('');
    expect(
      code,
      'generator.forBlock["rbac_resource"] must return the RES value as a quoted string, e.g. "USERACCOUNTS"',
    ).toMatch(new RegExp(`["']USERACCOUNTS["']`));
    ws.dispose();
  });

  it('rbac_rule with ALLOW generates return "Allow" and references the ACTION', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_rule');
    block.setFieldValue('ALLOW', 'EFFECT');
    block.setFieldValue('BAN', 'ACTION');
    generator.init(ws);
    const code = generator.blockToCode(block) as string;
    generator.finish('');
    expect(
      code,
      'generator.forBlock["rbac_rule"] must include the ACTION value ("BAN") in a conditional',
    ).toMatch(new RegExp(`["']BAN["']`));
    expect(
      code,
      'generator.forBlock["rbac_rule"] must return "Allow" when EFFECT is ALLOW',
    ).toMatch(/["']Allow["']/);
    ws.dispose();
  });

  it('rbac_rule with DENY generates return "Deny"', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_rule');
    block.setFieldValue('DENY', 'EFFECT');
    block.setFieldValue('FLAG', 'ACTION');
    generator.init(ws);
    const code = generator.blockToCode(block) as string;
    generator.finish('');
    expect(
      code,
      'generator.forBlock["rbac_rule"] must return "Deny" when EFFECT is DENY',
    ).toMatch(/["']Deny["']/);
    ws.dispose();
  });

  it('rbac_policy generates a named function with the correct signature', () => {
    const ws = new Blockly.Workspace();
    const block = ws.newBlock('rbac_policy');
    block.setFieldValue('MyPolicy', 'NAME');
    generator.init(ws);
    const code = generator.blockToCode(block) as string;
    generator.finish('');
    expect(
      code,
      'generator.forBlock["rbac_policy"] must produce a JS function named after the NAME field',
    ).toMatch(/function\s+MyPolicy\s*\(/);
    expect(
      code,
      'The generated function must accept (role, action, resource) as parameters',
    ).toMatch(/role\s*,\s*action\s*,\s*resource/);
    ws.dispose();
  });
});

// ── Step 3 – Full Policy Generation ──────────────────────────────────────────
// These tests pass once all blocks and generators work together.

describe('Step 3 – Full Policy Generation', () => {
  beforeAll(() => { defineBlocks(); });

  it('generates a function named SocialMediaModeration from the fixture workspace', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    const code = generator.workspaceToCode(ws);
    expect(
      code,
      'Expected the workspace to produce "function SocialMediaModeration(role, action, resource)" — check your rbac_policy generator',
    ).toMatch(new RegExp(`function\\s+SocialMediaModeration\\s*\\(\\s*role\\s*,\\s*action\\s*,\\s*resource\\s*\\)`));
    ws.dispose();
  });

  it('generated code includes a role membership guard with TRUSTANDSAFETYLEAD', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    const code = generator.workspaceToCode(ws);
    expect(
      code,
      'The allowedRoles list must contain "TRUSTANDSAFETYLEAD" as specified by the workspace fixture',
    ).toMatch(new RegExp(`["']TRUSTANDSAFETYLEAD["']`));
    ws.dispose();
  });

  it('generated code includes an action+resource conditional for BAN on USERACCOUNTS', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    const code = generator.workspaceToCode(ws);
    expect(
      code,
      'The generated code must check action === "BAN" — check your rbac_rule generator',
    ).toMatch(new RegExp(`["']BAN["']`));
    expect(
      code,
      'The generated code must include "USERACCOUNTS" in the resource list — check your rbac_resource generator',
    ).toMatch(new RegExp(`["']USERACCOUNTS["']`));
    ws.dispose();
  });

  it('generated code has a default return "Deny" at the end', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    const code = generator.workspaceToCode(ws);
    expect(
      code,
      'The policy function must end with return "Deny" as a catch-all fallback',
    ).toMatch(/return\s+["']Deny["']/);
    ws.dispose();
  });
});

// ── Step 4 – Policy Evaluation Correctness ───────────────────────────────────
// These tests pass once the generated logic is semantically correct.

describe('Step 4 – Policy Evaluation Correctness', () => {
  beforeAll(() => { defineBlocks(); });

  it('SocialMediaModeration: TRUSTANDSAFETYLEAD BAN USERACCOUNTS → Allow', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    expect(
      runPolicy(ws, 'SocialMediaModeration', 'TRUSTANDSAFETYLEAD', 'BAN', 'USERACCOUNTS'),
      'TRUSTANDSAFETYLEAD performing BAN on USERACCOUNTS should be allowed — check that the fixture has TRUSTANDSAFETYLEAD in ROLES with an ALLOW BAN rule for USERACCOUNTS',
    ).toBe('Allow');
    ws.dispose();
  });

  it('SocialMediaModeration: MODERATOR BAN USERACCOUNTS → Deny (role not listed)', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    expect(
      runPolicy(ws, 'SocialMediaModeration', 'MODERATOR', 'BAN', 'USERACCOUNTS'),
      'MODERATOR is not in the policy\'s ROLES list — the role guard must return "Deny" before checking rules',
    ).toBe('Deny');
    ws.dispose();
  });

  it('SocialMediaModeration: TRUSTANDSAFETYLEAD FLAG USERACCOUNTS → Deny (action not covered)', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    expect(
      runPolicy(ws, 'SocialMediaModeration', 'TRUSTANDSAFETYLEAD', 'FLAG', 'USERACCOUNTS'),
      'FLAG is not covered by any rule in this policy — the function must fall through to the default Deny',
    ).toBe('Deny');
    ws.dispose();
  });

  it('SocialMediaModeration: TRUSTANDSAFETYLEAD BAN REPORTEDCONTENT → Deny (resource not covered)', () => {
    const ws = loadFixture('data-viewer.workspace.json');
    expect(
      runPolicy(ws, 'SocialMediaModeration', 'TRUSTANDSAFETYLEAD', 'BAN', 'REPORTEDCONTENT'),
      'REPORTEDCONTENT is not in the BAN rule\'s resource list — the conditional must not match and must fall through to Deny',
    ).toBe('Deny');
    ws.dispose();
  });
});
