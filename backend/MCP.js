

// import 'dotenv/config';
// import { agent } from "./deepAgent.js";

// const result = await agent.invoke({
//   messages: [{ role: "user", content: "What is langgraph?" }],
// });

// console.log(result.messages[result.messages.length - 1].content);







import { createDeepAgent } from "deepagents";
import { agent } from './systemPrompt.js';
import 'dotenv/config';
const { MultiServerMCPClient } = await import("@langchain/mcp-adapters");

const client = new MultiServerMCPClient({
    my_server: {
        transport: "http",
        url: "http://localhost:1111/mcp",
    },
});

const tools = await client.getTools();



const result = await agent.invoke({
    messages: [{ role: "user", content: "Use the MCP server to help me." }],
});