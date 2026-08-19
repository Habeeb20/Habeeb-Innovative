

// import dns from "dns";
// dns.setServers(["8.8.8.8", "1.1.1.1"]);
// import express from 'express';
// import cors from 'cors';
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
// import { z } from 'zod';
// import dotenv from 'dotenv';
// import { groq } from '@ai-sdk/groq';
// import { streamText, convertToModelMessages, pipeUIMessageStreamToResponse, toUIMessageStream } from 'ai';
// import { connectDb } from './db.js';
// import Conversation from './models/Conversation.js';

// dotenv.config();
// connectDb();

// const server = new McpServer({ name: 'my_server', version: '1.0.0' });

// server.registerTool(
//   'get_weather',
//   {
//     title: 'Get Weather',
//     description: 'Get the current weather for a city',
//     inputSchema: { city: z.string() },
//   },
//   async ({ city }) => ({
//     content: [{ type: 'text', text: `The weather in ${city} is sunny, 28°C.` }],
//   })
// );

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.post('/mcp', async (req, res) => {
//   const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
//   res.on('close', () => transport.close());
//   await server.connect(transport);
//   await transport.handleRequest(req, res, req.body);
// });

// // ---- Chat route: streams response + saves to DB in background ----
// app.post('/api/chat', async (req, res) => {
//   const { messages, conversationId, userId } = req.body;

//   const modelMessages = await convertToModelMessages(messages);

//   const result = streamText({
//     model: groq('openai/gpt-oss-120b'),
//     system: `You are Habeeb Innovative AI, an AI assistant created by Habeeb Waliyu. 
// You are not ChatGPT, Claude, Gemini, or any other AI — you are Habeeb Innovative AI.
// If asked who you are or who made you, always answer that you are Habeeb Innovative AI, built by Habeeb Waliyu.
// Be helpful, clear, and friendly in your responses.`,
//     messages: modelMessages,
//   });

//   const uiStream = toUIMessageStream({ stream: result.stream });
//   pipeUIMessageStreamToResponse({ stream: uiStream, response: res });

//   // Save AFTER kicking off the stream, so DB write doesn't delay the response
// result.text.then(async (finalText) => {
//   try {
//     const assistantMessage = {
//       id: crypto.randomUUID(),
//       role: 'assistant',
//       parts: [{ type: 'text', text: finalText }],
//     };
//     const fullMessages = [...messages, assistantMessage];

//     const title =
//       messages[0]?.parts?.find((p) => p.type === 'text')?.text?.slice(0, 40) || 'New chat';

//     await Conversation.findByIdAndUpdate(
//       conversationId,
//       { userId, title, messages: fullMessages },
//       { upsert: true, setDefaultsOnInsert: true } // creates it if it doesn't exist yet
//     );
//   } catch (err) {
//     console.error('Failed to save conversation:', err);
//   }
// });
// });

// // ---- List conversations ----
// app.get('/api/conversations', async (req, res) => {
//   const { userId } = req.query;
//   const conversations = await Conversation.find({ userId })
//     .select('title createdAt updatedAt')
//     .sort({ updatedAt: -1 });
//   res.json(conversations);
// });

// // ---- Load one conversation ----
// app.get('/api/conversations/:id', async (req, res) => {
//   const conversation = await Conversation.findById(req.params.id);
//   if (!conversation) return res.status(404).json({ error: 'Not found' });
//   res.json(conversation);
// });

// // ---- Delete a conversation ----
// app.delete('/api/conversations/:id', async (req, res) => {
//   await Conversation.findByIdAndDelete(req.params.id);
//   res.status(204).end();
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));










import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { groq } from '@ai-sdk/groq';
import {
  streamText,
  convertToModelMessages,
  pipeUIMessageStreamToResponse,
  toUIMessageStream,
  tool,
} from 'ai';
import { connectDb } from './db.js';
import Conversation from './models/conversation.js';
import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';

dotenv.config();
connectDb();

const server = new McpServer({ name: 'my_server', version: '1.0.0' });

server.registerTool(
  'get_weather',
  {
    title: 'Get Weather',
    description: 'Get the current weather for a city',
    inputSchema: { city: z.string() },
  },
  async ({ city }) => ({
    content: [{ type: 'text', text: `The weather in ${city} is sunny, 28°C.` }],
  })
);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", async(req, res) => {
  res.send("the api is running")
})

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// ---- SAFETY: restrict all file tools to one project directory ----
// Change this to whatever folder you want the AI allowed to read/write in.
const SAFE_ROOT = process.env.AI_WORKSPACE_ROOT || path.resolve('./workspace');

function resolveSafePath(userPath) {
  const resolved = path.resolve(SAFE_ROOT, userPath);
  if (!resolved.startsWith(SAFE_ROOT)) {
    throw new Error('Access denied: path is outside the allowed workspace');
  }
  return resolved;
}

// ---- Code tools ----
const readFile = tool({
  description: 'Read the contents of a file in the workspace, to inspect or debug code',
  parameters: z.object({
    filePath: z.string().describe('Relative path to the file, e.g. "src/app.js"'),
  }),
  execute: async ({ filePath }) => {
    try {
      const safePath = resolveSafePath(filePath);
      return await fs.readFile(safePath, 'utf-8');
    } catch (err) {
      return `Error reading file: ${err.message}`;
    }
  },
});

const writeFile = tool({
  description: 'Write or overwrite a file in the workspace with new code',
  parameters: z.object({
    filePath: z.string().describe('Relative path to the file, e.g. "src/app.js"'),
    content: z.string().describe('The full new content to write to the file'),
  }),
  execute: async ({ filePath, content }) => {
    try {
      const safePath = resolveSafePath(filePath);
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, content, 'utf-8');
      return `File written successfully: ${filePath}`;
    } catch (err) {
      return `Error writing file: ${err.message}`;
    }
  },
});

const runLinter = tool({
  description: 'Run ESLint on a file and return any errors or warnings found',
  parameters: z.object({
    filePath: z.string().describe('Relative path to the file to lint'),
  }),
  execute: async ({ filePath }) => {
    try {
      const safePath = resolveSafePath(filePath);
      const output = execSync(`npx eslint "${safePath}"`, { encoding: 'utf-8' });
      return output || 'No lint errors found.';
    } catch (err) {
      // eslint exits non-zero when it finds errors — stdout still has the useful info
      return err.stdout?.toString() || err.message;
    }
  },
});

const runTests = tool({
  description: 'Run the test suite in the workspace and return the results',
  parameters: z.object({
    testCommand: z.string().optional().describe('Custom test command, defaults to "npm test"'),
  }),
  execute: async ({ testCommand }) => {
    try {
      const output = execSync(testCommand || 'npm test', {
        cwd: SAFE_ROOT,
        encoding: 'utf-8',
      });
      return output;
    } catch (err) {
      return err.stdout?.toString() || err.message;
    }
  },
});

const codeTools = { readFile, writeFile, runLinter, runTests };

// ---- Chat route: streams response + saves to DB in background ----
app.post('/api/chat', async (req, res) => {
  const { messages, conversationId, userId } = req.body;

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: groq('openai/gpt-oss-120b'),
    system: `You are Habeeb Innovative AI, an AI assistant created by Habeeb Waliyu.
You are not ChatGPT, Claude, Gemini, or any other AI — you are Habeeb Innovative AI.
If asked who you are or who made you, always answer that you are Habeeb Innovative AI, built by Habeeb Waliyu.
Be helpful, clear, and friendly in your responses.

You can read files, write/edit files, run a linter, and run tests inside a safe workspace folder when the user asks you to write code, fix bugs, or check their work. Use these tools whenever a coding task requires it instead of just describing what to do.`,
    messages: modelMessages,
    tools: codeTools,
  });

  const uiStream = toUIMessageStream({ stream: result.stream });
  pipeUIMessageStreamToResponse({ stream: uiStream, response: res });

  // Save AFTER kicking off the stream, so DB write doesn't delay the response
  result.text.then(async (finalText) => {
    try {
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ type: 'text', text: finalText }],
      };
      const fullMessages = [...messages, assistantMessage];

      const title =
        messages[0]?.parts?.find((p) => p.type === 'text')?.text?.slice(0, 40) || 'New chat';

      await Conversation.findByIdAndUpdate(
        conversationId,
        { userId, title, messages: fullMessages },
        { upsert: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  });
});

// ---- List conversations ----
app.get('/api/conversations', async (req, res) => {
  const { userId } = req.query;
  const conversations = await Conversation.find({ userId })
    .select('title createdAt updatedAt')
    .sort({ updatedAt: -1 });
  res.json(conversations);
});

// ---- Load one conversation ----
app.get('/api/conversations/:id', async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Not found' });
  res.json(conversation);
});

// ---- Delete a conversation ----
app.delete('/api/conversations/:id', async (req, res) => {
  await Conversation.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));