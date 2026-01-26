/**
 * Tool adapter for Azure AI Foundry
 * Provides compatibility between Vercel AI SDK tools and native OpenAI SDK
 */

import type { z } from "zod";

/**
 * Foundry tool definition (compatible with OpenAI function calling)
 */
export interface FoundryTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  parameters: any; // JSON Schema
  execute: (input: TInput) => Promise<TOutput>;
  needsApproval?: boolean;
}

/**
 * Convert Zod schema to JSON Schema
 * Simplified version - handles common types used in our tools
 */
export function zodToJsonSchema(schema: z.ZodType<any>): any {
  // Get the schema definition
  const def = (schema as any)._def;

  // Handle ZodObject
  if (def.typeName === "ZodObject") {
    const shape = def.shape();
    const properties: any = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodValue = value as z.ZodType<any>;
      properties[key] = zodToJsonSchema(zodValue);

      // Check if required (not optional)
      const valueDef = (zodValue as any)._def;
      if (valueDef.typeName !== "ZodOptional") {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  // Handle ZodString
  if (def.typeName === "ZodString") {
    const result: any = { type: "string" };

    // Check for description
    if (def.description) {
      result.description = def.description;
    }

    return result;
  }

  // Handle ZodNumber
  if (def.typeName === "ZodNumber") {
    const result: any = { type: "number" };

    if (def.description) {
      result.description = def.description;
    }

    return result;
  }

  // Handle ZodBoolean
  if (def.typeName === "ZodBoolean") {
    return { type: "boolean" };
  }

  // Handle ZodArray
  if (def.typeName === "ZodArray") {
    return {
      type: "array",
      items: zodToJsonSchema(def.type),
    };
  }

  // Handle ZodOptional
  if (def.typeName === "ZodOptional") {
    return zodToJsonSchema(def.innerType);
  }

  // Handle ZodEnum
  if (def.typeName === "ZodEnum") {
    return {
      type: "string",
      enum: def.values,
    };
  }

  // Handle ZodUnion (simplified - just takes first option)
  if (def.typeName === "ZodUnion") {
    return zodToJsonSchema(def.options[0]);
  }

  // Fallback - generic object
  return { type: "object" };
}

/**
 * Create a Foundry-compatible tool from Vercel AI SDK tool config
 */
export function createFoundryTool<TInput, TOutput>(config: {
  description: string;
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput) => Promise<TOutput>;
  needsApproval?: boolean;
}): FoundryTool<TInput, TOutput> & {
  // Also keep Vercel SDK compatibility
  description: string;
  parameters: any;
  execute: (input: TInput) => Promise<TOutput>;
} {
  // Convert Zod schema to JSON Schema
  const jsonSchema = zodToJsonSchema(config.inputSchema);

  return {
    name: "", // Will be set by the tool definition
    description: config.description,
    parameters: jsonSchema,
    execute: config.execute,
    needsApproval: config.needsApproval,
  };
}

/**
 * Convert tool to OpenAI function definition
 */
export function toolToOpenAIFunction(
  name: string,
  tool: FoundryTool
): {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
} {
  return {
    type: "function",
    function: {
      name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

/**
 * Tool registry for managing tools in Foundry path
 */
export class ToolRegistry {
  private tools = new Map<string, FoundryTool>();

  register(name: string, tool: FoundryTool) {
    tool.name = name;
    this.tools.set(name, tool);
  }

  get(name: string): FoundryTool | undefined {
    return this.tools.get(name);
  }

  getAll(): FoundryTool[] {
    return Array.from(this.tools.values());
  }

  getOpenAIFunctions(): Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }> {
    return Array.from(this.tools.entries()).map(([name, tool]) =>
      toolToOpenAIFunction(name, tool)
    );
  }

  async execute(name: string, input: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return await tool.execute(input);
  }

  needsApproval(name: string): boolean {
    const tool = this.tools.get(name);
    return tool?.needsApproval ?? false;
  }
}
