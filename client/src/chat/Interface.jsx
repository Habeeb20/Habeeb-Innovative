import { useChat } from 'ai/react';

export default function App() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-2xl py-8 px-4">
        <div className="space-y-4 mb-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-lg px-4 py-2
                  ${m.role === 'user' ? 'bg-blue-100 text-black' : 'bg-gray-100 text-black'}
                `}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {m.role === 'user' ? 'You' : 'Llama 3.3 70B powered by Groq'}
                </div>
                <div>{m.content}</div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2 text-black"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask something..."
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}