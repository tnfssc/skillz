# SKILL.md Format Specification

## Overview

`SKILL.md` is the main entry point for a Claude skill. It contains instructions, context, and workflow definitions that Claude uses to execute the skill.

## Structure

A typical SKILL.md file has the following structure:

```markdown
# Skill Name

Brief description of what this skill does.

## Purpose

Detailed explanation of the skill's purpose and use cases.

## Prerequisites

- Any requirements or setup needed
- Dependencies that must be installed
- Environment variables or configuration

## Instructions

Step-by-step instructions for Claude to follow:

1. First, analyze the user's input...
2. Then, perform validation...
3. Execute the main workflow...
4. Finally, return the results...

## Parameters

### Input Parameters

- `parameter_name` (type): Description
- `another_param` (type, optional): Description with default value

### Output Format

Description of what the skill returns and in what format.

## Examples

### Example 1: Basic Usage

**Input:**
\`\`\`
Example input data
\`\`\`

**Output:**
\`\`\`
Expected output
\`\`\`

### Example 2: Advanced Usage

...

## MCP Tools Used

List of MCP server tools this skill invokes:
- `tool_name` from `server_name` - Description
- `another_tool` from `another_server` - Description

## Error Handling

How to handle common errors and edge cases.

## Notes

Any additional information, tips, or caveats.
```

## Best Practices

1. **Be Specific**: Provide clear, unambiguous instructions
2. **Include Examples**: Real-world examples help Claude understand intent
3. **Document Dependencies**: List all required MCP tools and skills
4. **Error Handling**: Include guidance for common failure modes
5. **Version Appropriately**: Update when changing skill behavior

## Composability

Skills can reference other skills:

```markdown
## Dependencies

This skill uses the following skills:
- `text-analyzer`: For preprocessing input
- `formatter`: For output formatting

## Workflow

1. Use the `text-analyzer` skill to preprocess input
2. Perform main analysis
3. Use the `formatter` skill to format results
```

## Variables and Templating

Skills can use variables from skillz.yaml:

```markdown
## Configuration

Database path: {{config.database_path}}
API endpoint: {{config.api_endpoint}}
```

These variables are defined in skillz.yaml config section.

## Future Enhancements

Potential additions to consider:
- Skill versioning within the markdown
- Conditional logic blocks
- Parameterized sections
- Schema validation for inputs/outputs
