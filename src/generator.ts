import { javascriptGenerator } from 'blockly/javascript';

export const generator = javascriptGenerator;

generator.forBlock['rbac_role'] = function (block) {
  const role = block.getFieldValue('ROLE');
  return `"${role}",`;
};

generator.forBlock['rbac_resource'] = function (block) {
  const res = block.getFieldValue('RES');
  return `"${res}",`;
};

generator.forBlock['rbac_rule'] = function (block) {

  const effect = block.getFieldValue('EFFECT');
  const action = block.getFieldValue('ACTION');

  const returnVal =
    effect === 'ALLOW' ? 'Allow' : 'Deny';

  let resources: any =
    generator.statementToCode(block, 'RESOURCES');

  resources = resources
    .split(',')
    .filter((r: string) => r.trim() !== '');

  return `
if (action === "${action}" && [${resources}].includes(resource)) {
  return "${returnVal}";
}
`;
};

generator.forBlock['rbac_policy'] = function (block) {

  let roles: any =
    generator.statementToCode(block, 'ROLES');

  roles = roles
    .split(',')
    .filter((r: string) => r.trim() !== '');

  const rules =
    generator.statementToCode(block, 'RULES');

  const name = block.getFieldValue('NAME');

  return `
function ${name}(role, action, resource) {

  if (![${roles}].includes(role)) {
    return "Deny";
  }

  ${rules}

  return "Deny";
}
`;
};