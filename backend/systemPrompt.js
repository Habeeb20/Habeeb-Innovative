// import { createDeepAgent } from "deepagents";
// import { internetSearch } from "./tools.js";
// import { createCodeInterpreterMiddleware } from "@langchain/quickjs";
// // System prompt to steer the agent to be an expert researcher
// const researchInstructions = `You are an expert researcher. Your job is to conduct thorough research and then write a polished report.

// You have access to an internet search tool as your primary means of gathering information.

// ## \`internet_search\`

// Use this to run an internet search for a given query. You can specify the max number of results to return, the topic, and whether raw content should be included.
// `;



// export const agent = createDeepAgent({
//   model: "groq:openai/gpt-oss-120b",
//   tools: [internetSearch],
//     middleware: [createCodeInterpreterMiddleware()],
//   systemPrompt: researchInstructions,
//   stream: true
// });




import "dotenv/config";
import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

// ---- Tool: internet_search ----
const internetSearch = tool(
  async ({ query, maxResults = 5, topic = "general", includeRawContent = false }) => {
    const tavilySearch = new TavilySearch({
      maxResults,
      tavilyApiKey: process.env.TAVILY_API_KEY,
      includeRawContent,
      topic,
    });
    return await tavilySearch._call({ query });
  },
  {
    name: "internet_search",
    description: "Run a web search",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z.number().optional().default(5).describe("Maximum number of results to return"),
      topic: z.enum(["general", "news", "finance"]).optional().default("general").describe("Search topic category"),
      includeRawContent: z.boolean().optional().default(false).describe("Whether to include raw content"),
    }),
  }
);

// ---- MCP tools (fetched once, at startup) ----
const mcpClient = new MultiServerMCPClient({
  my_server: {
    transport: "http",
    url: "http://localhost:1111/mcp",
  },
});
const mcpTools = await mcpClient.getTools();

// ---- Sub-agent: research-agent ----
const researchSubagent = {
  name: "research-agent",
  description: "Used to research more in depth questions",
  systemPrompt: "You are a great researcher",
  tools: [internetSearch],
  model: "groq:openai/gpt-oss-20b",
};

const researchInstructions = `You are an expert researcher. Your job is to conduct thorough research and then write a polished report.

You have access to an internet search tool as your primary means of gathering information, and MCP tools for additional capabilities.

## \`internet_search\`

Use this to run an internet search for a given query. You can specify the max number of results to return, the topic, and whether raw content should be included.
`;

// ---- Main agent (all tools bound here at creation time) ----
export const agent = await createDeepAgent({
  model: "groq:openai/gpt-oss-120b",
  tools: [internetSearch, ...mcpTools],
  subagents: [researchSubagent],
  systemPrompt: researchInstructions,
});