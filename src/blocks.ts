import * as Blockly from 'blockly';

export function defineBlocks() {
  Blockly.defineBlocksWithJsonArray([

    {
      "type": "rbac_policy",
      "message0": "Policy Name %1 Roles %2 Rules %3",
      "args0": [
        {
          "type": "field_input",
          "name": "NAME",
          "text": "Policy"
        },
        {
          "type": "input_statement",
          "name": "ROLES",
          "check": "rbac_role"
        },
        {
          "type": "input_statement",
          "name": "RULES",
          "check": "rbac_rule"
        }
      ],
      "colour": 230
    },

    {
      "type": "rbac_role",
      "message0": "Role %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "ROLE",
          "options": [
           ["TrustandSafetyLead", "TRUSTANDSAFETYLEAD"],
           ["Moderator", "MODERATOR"],
           ["User", "USER"]
          ]
        }
      ],
      "previousStatement": "rbac_role",
      "nextStatement": "rbac_role",
      "colour": 120
    },

    {
      "type": "rbac_rule",
      "message0": "Effect %1 Action %2 Resources %3",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "EFFECT",
          "options": [
            ["Allow", "ALLOW"],
            ["Deny", "DENY"]
          ]
        },
        {
          "type": "field_dropdown",
          "name": "ACTION",
          "options": [
            ["Ban", "BAN"],
            ["Flag", "FLAG"],
            ["Post", "POST"]
          ]
        },
        {
          "type": "input_statement",
          "name": "RESOURCES",
          "check": "rbac_resource"
        }
      ],
      "previousStatement": "rbac_rule",
      "nextStatement": "rbac_rule",
      "colour": 20
    },

    {
      "type": "rbac_resource",
      "message0": "Resource %1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "RES",
          "options": [
            ["UserAccounts", "USERACCOUNTS"],
            ["ReportedContent", "REPORTEDCONTENT"],
            ["PublicTimeline", "PUBLICTIMELINE"]
          ]
        }
      ],
      "previousStatement": "rbac_resource",
      "nextStatement": "rbac_resource",
      "colour": 65
    }

  ]);
}