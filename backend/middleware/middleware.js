import { tool } from "langchain/tools";
import { createDeepAgent } from "deepagents";
import * as z from "zod";

const getWeather = tool(
  ({ city }) => {
    return `The weather in ${city} is sunny.`;
  },
  {
    name: "get_weather",
    description: "Get the weather in a city.",
    schema: z.object({
      city: z.string(),
    }),
  }
);

let callCount = 0;

const logToolCallsMiddleware = {
  name: "LogToolCallsMiddleware",
  wrapToolCall: async (request, handler) => {
    callCount += 1;
    const toolName = request.toolCall.name;

    console.log(`[Middleware] Tool call #${callCount}: ${toolName}`);
    console.log(`[Middleware] Arguments: ${JSON.stringify(request.toolCall.args)}`);

    const result = await handler(request);

    console.log(`[Middleware] Tool call #${callCount} completed`);

    return result;
  },
};

const agent = await createDeepAgent({
  model: "openrouter:openrouter:z-ai/glm-5.2",
  tools: [getWeather],
  middleware: [logToolCallsMiddleware],
});

// Example usage
async function main() {
  const result = await agent.invoke({
    messages: [{ role: "user", content: "What's the weather in Tokyo?" }]
  });
  console.log(result);
}

main().catch(console.error);