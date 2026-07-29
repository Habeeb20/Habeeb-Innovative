// import { tool } from "langchain";
// import { TavilySearch } from "@langchain/tavily";
// import { z } from "zod";
// import dotenv from "dotenv"
// export const internetSearch = tool(
//   async ({
//     query,
//     maxResults = 5,
//     topic = "general",
//     includeRawContent = false,
//   }) => {
//     const tavilySearch = new TavilySearch({
//       maxResults,
//       tavilyApiKey: process.env.TAVILY_API_KEY,
//       includeRawContent,
//       topic,
//     });
//     return await tavilySearch._call({ query });
//   },
//   {
//     name: "internet_search",
//     description: "Run a web search",
//     schema: z.object({
//       query: z.string().describe("The search query"),
//       maxResults: z
//         .number()
//         .optional()
//         .default(5)
//         .describe("Maximum number of results to return"),
//       topic: z
//         .enum(["general", "news", "finance"])
//         .optional()
//         .default("general")
//         .describe("Search topic category"),
//       includeRawContent: z
//         .boolean()
//         .optional()
//         .default(false)
//         .describe("Whether to include raw content"),
//     }),
//   },
// );



import 'dotenv/config';
import { tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { createDeepAgent } from "deepagents";
import { z } from "zod";

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

// ---- Sub-agent: research-agent ----
const researchSubagent = {
  name: "research-agent",
  description: "Used to research more in depth questions",
  systemPrompt: "You are a great researcher",
  tools: [internetSearch],
  model: "groq:openai/gpt-oss-20b", // matches your working Groq setup
};

const subagents = [researchSubagent];

// ---- Main agent ----
export const agent = createDeepAgent({
  model: "groq:openai/gpt-oss-20b",
  tools: [internetSearch],
  subagents,
  stream:true
});
