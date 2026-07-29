




// import { useChat } from '@ai-sdk/react';
// import { DefaultChatTransport } from 'ai';
// import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// const API_BASE = import.meta.env.VITE_BACKEND_URL;
// const USER_ID_KEY = 'habeeb_ai_user_id';

// // Anonymous but stable user id, since there's no auth system yet
// function getUserId() {
//   let id = localStorage.getItem(USER_ID_KEY);
//   if (!id) {
//     id = crypto.randomUUID();
//     localStorage.setItem(USER_ID_KEY, id);
//   }
//   return id;
// }

// // ---------- Copy button ----------
// function CopyButton({ text }) {
//   const [copied, setCopied] = useState(false);

//   const handleCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 1500);
//     } catch (err) {
//       console.error('Copy failed:', err);
//     }
//   };

//   return (
//     <button
//       onClick={handleCopy}
//       className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#8592AA] transition hover:bg-[#0B1420] hover:text-[#D4AF37]"
//     >
//       {copied ? (
//         <>
//           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <polyline points="20 6 9 17 4 12" />
//           </svg>
//           Copied
//         </>
//       ) : (
//         <>
//           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <rect x="9" y="9" width="13" height="13" rx="2" />
//             <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
//           </svg>
//           Copy
//         </>
//       )}
//     </button>
//   );
// }

// // ---------- Markdown renderer with code-block styling ----------
// function MessageContent({ text }) {
//   return (
//     <ReactMarkdown
//       remarkPlugins={[remarkGfm]}
//       components={{
//         code({ inline, className, children, ...props }) {
//           const match = /language-(\w+)/.exec(className || '');
//           const codeString = String(children).replace(/\n$/, '');

//           if (inline) {
//             return (
//               <code className="rounded bg-[#0B1420] px-1.5 py-0.5 text-[#F1D786] text-[13px]" {...props}>
//                 {children}
//               </code>
//             );
//           }

//           return (
//             <div className="my-3 overflow-hidden rounded-lg border border-[#D4AF37]/20">
//               <div className="flex items-center justify-between bg-[#0B1420] px-3 py-1.5">
//                 <span className="text-[11px] font-medium uppercase tracking-wider text-[#D4AF37]">
//                   {match?.[1] || 'code'}
//                 </span>
//                 <CopyButton text={codeString} />
//               </div>
//               <SyntaxHighlighter
//                 language={match?.[1] || 'text'}
//                 style={oneDark}
//                 customStyle={{ margin: 0, background: '#0d1522', fontSize: '13px', padding: '12px' }}
//               >
//                 {codeString}
//               </SyntaxHighlighter>
//             </div>
//           );
//         },
//         p({ children }) {
//           return <p className="mb-2 last:mb-0">{children}</p>;
//         },
//       }}
//     >
//       {text}
//     </ReactMarkdown>
//   );
// }

// export default function App() {
//   const [input, setInput] = useState('');
//   const [conversations, setConversations] = useState([]);
//   const [activeId, setActiveId] = useState(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [loadingConversations, setLoadingConversations] = useState(true);

//   const userId = useRef(getUserId()).current;

//   const { messages, sendMessage, status, setMessages } = useChat({
//     transport: new DefaultChatTransport({
//       api: `${API_BASE}/api/chat`,
//       body: () => ({
//         conversationId: activeId,
//         userId,
//       }),
//     }),
//   });

//   const scrollRef = useRef(null);
//   const textareaRef = useRef(null);

//   // ---------- Fetch conversation list from the backend ----------
//   const refreshConversations = useCallback(async () => {
//     try {
//       const res = await fetch(`${API_BASE}/api/conversations?userId=${userId}`);
//       const data = await res.json();
//       setConversations(data);
//     } catch (err) {
//       console.error('Failed to load conversations:', err);
//     } finally {
//       setLoadingConversations(false);
//     }
//   }, [userId]);

//   useEffect(() => {
//     refreshConversations();
//   }, [refreshConversations]);

//   // Re-sync the sidebar after the assistant finishes replying,
//   // since that's when the backend actually persists the turn.
//   useEffect(() => {
//     if (status === 'ready') refreshConversations();
//   }, [status, refreshConversations]);

//   useEffect(() => {
//     scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
//   }, [messages, status]);

//   const startNewChat = useCallback(() => {
//     setActiveId(crypto.randomUUID());
//     setMessages([]);
//     setSidebarOpen(false);
//   }, [setMessages]);

//   const loadConversation = async (conv) => {
//     try {
//       const res = await fetch(`${API_BASE}/api/conversations/${conv._id}`);
//       const data = await res.json();
//       setActiveId(data._id);
//       setMessages(data.messages);
//       setSidebarOpen(false);
//     } catch (err) {
//       console.error('Failed to load conversation:', err);
//     }
//   };

//   const deleteConversation = async (id, e) => {
//     e.stopPropagation();
//     try {
//       await fetch(`${API_BASE}/api/conversations/${id}`, { method: 'DELETE' });
//       setConversations((prev) => prev.filter((c) => c._id !== id));
//       if (id === activeId) startNewChat();
//     } catch (err) {
//       console.error('Failed to delete conversation:', err);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;
//     if (!activeId) setActiveId(crypto.randomUUID());
//     sendMessage({ text: input });
//     setInput('');
//     if (textareaRef.current) textareaRef.current.style.height = 'auto';
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit(e);
//     }
//   };

//   const handleInputChange = (e) => {
//     setInput(e.target.value);
//     e.target.style.height = 'auto';
//     e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
//   };

//   const isBusy = status !== 'ready';

//   return (
//     <div className="flex h-screen bg-[#0B1420]">
//       {/* Sidebar */}
//       <aside
//         className={`
//           fixed inset-y-0 left-0 z-20 w-72 transform border-r border-[#D4AF37]/20 bg-[#0B1420] transition-transform duration-200
//           sm:relative sm:translate-x-0
//           ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//         `}
//       >
//         <div className="flex h-full flex-col p-3">
//           <button
//             onClick={startNewChat}
//             className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 py-2.5 text-sm font-medium text-[#D4AF37] transition hover:bg-[#111C2F]"
//           >
//             + New Chat
//           </button>
//           <div className="flex-1 space-y-1 overflow-y-auto">
//             {loadingConversations && (
//               <p className="px-3 py-2 text-xs text-[#8592AA]">Loading history…</p>
//             )}
//             {!loadingConversations && conversations.length === 0 && (
//               <p className="px-3 py-2 text-xs text-[#8592AA]">No conversations yet.</p>
//             )}
//             {conversations.map((conv) => (
//               <div
//                 key={conv._id}
//                 onClick={() => loadConversation(conv)}
//                 className={`
//                   group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition
//                   ${conv._id === activeId ? 'bg-[#111C2F] text-white' : 'text-[#8592AA] hover:bg-[#111C2F]/60'}
//                 `}
//               >
//                 <span className="truncate">{conv.title}</span>
//                 <button
//                   onClick={(e) => deleteConversation(conv._id, e)}
//                   className="ml-2 shrink-0 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
//                 >
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
//                   </svg>
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </aside>

//       {sidebarOpen && (
//         <div className="fixed inset-0 z-10 bg-black/50 sm:hidden" onClick={() => setSidebarOpen(false)} />
//       )}

//       {/* Main chat area */}
//       <div className="flex flex-1 flex-col">
//         <header className="shrink-0 border-b border-[#D4AF37]/30 bg-[#0B1420] px-4 py-4 sm:px-6">
//           <div className="mx-auto flex max-w-2xl items-center gap-3">
//             <button onClick={() => setSidebarOpen(true)} className="text-[#D4AF37] sm:hidden">
//               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M3 12h18M3 6h18M3 18h18" />
//               </svg>
//             </button>
//             <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#111C2F] text-[#D4AF37] font-semibold text-sm">
//               HI
//             </div>
//             <div className="flex flex-col">
//               <h1 className="text-[15px] sm:text-base font-semibold tracking-wide text-white">
//                 Habeeb Innovative AI
//               </h1>
//               <span className="flex items-center gap-1.5 text-xs text-[#8592AA]">
//                 <span
//                   className={`h-1.5 w-1.5 rounded-full ${
//                     isBusy ? 'bg-[#D4AF37] animate-pulse' : 'bg-[#D4AF37]/60'
//                   }`}
//                 />
//                 {isBusy ? 'Thinking…' : 'Online'}
//               </span>
//             </div>
//           </div>
//         </header>

//         <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
//           <div className="mx-auto flex max-w-2xl flex-col gap-4">
//             {messages.length === 0 && (
//               <div className="mt-10 flex flex-col items-center text-center">
//                 <div className="mb-4 h-px w-16 bg-[#D4AF37]/40" />
//                 <p className="text-sm text-[#8592AA]">
//                   Ask Habeeb Innovative AI anything to get started.
//                 </p>
//               </div>
//             )}

//             {messages.map((m) => {
//               const textContent = m.parts?.filter((p) => p.type === 'text').map((p) => p.text).join('') || '';
//               return (
//                 <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//                   <div
//                     className={`
//                       group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
//                       ${
//                         m.role === 'user'
//                           ? 'bg-[#D4AF37] text-[#0B1420] rounded-br-sm'
//                           : 'bg-[#111C2F] text-white border-l-2 border-[#D4AF37] rounded-bl-sm'
//                       }
//                     `}
//                   >
//                     <div className="mb-1 flex items-center justify-between gap-3">
//                       <span
//                         className={`text-[11px] font-medium uppercase tracking-wider ${
//                           m.role === 'user' ? 'text-[#0B1420]/60' : 'text-[#D4AF37]'
//                         }`}
//                       >
//                         {m.role === 'user' ? 'You' : 'Habeeb Innovative AI'}
//                       </span>
//                       {m.role !== 'user' && (
//                         <span className="opacity-0 transition group-hover:opacity-100">
//                           <CopyButton text={textContent} />
//                         </span>
//                       )}
//                     </div>
//                     {m.role === 'user' ? (
//                       <div className="whitespace-pre-wrap">{textContent}</div>
//                     ) : (
//                       <MessageContent text={textContent} />
//                     )}
//                   </div>
//                 </div>
//               );
//             })}

//             {isBusy && (
//               <div className="flex justify-start">
//                 <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border-l-2 border-[#D4AF37] bg-[#111C2F] px-4 py-3">
//                   <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.3s]" />
//                   <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.15s]" />
//                   <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37]" />
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="shrink-0 border-t border-[#D4AF37]/30 bg-[#0B1420] px-4 py-4 sm:px-6">
//           <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-end gap-2">
//             <textarea
//               ref={textareaRef}
//               rows={1}
//               className="max-h-40 flex-1 resize-none rounded-xl border border-[#D4AF37]/30 bg-[#111C2F] px-4 py-3 text-sm text-white placeholder-[#8592AA] outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
//               value={input}
//               onChange={handleInputChange}
//               onKeyDown={handleKeyDown}
//               placeholder="Message Habeeb Innovative AI... (Shift+Enter for new line)"
//               disabled={isBusy}
//             />
//             <button
//               type="submit"
//               disabled={isBusy || !input.trim()}
//               className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#0B1420] transition hover:bg-[#F1D786] disabled:cursor-not-allowed disabled:opacity-40"
//             >
//               Send
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }








import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API_BASE = import.meta.env.VITE_BACKEND_URL;
const USER_ID_KEY = 'habeeb_ai_user_id';

function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

// ---------- Copy button ----------
const CopyButton = memo(function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#8592AA] transition hover:bg-[#0B1420] hover:text-[#D4AF37]"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
});

// ---------- Markdown renderer with code-block styling (only used when NOT streaming) ----------
const MessageContent = memo(function MessageContent({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          if (inline) {
            return (
              <code className="rounded bg-[#0B1420] px-1.5 py-0.5 text-[#F1D786] text-[13px]" {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="my-3 overflow-hidden rounded-lg border border-[#D4AF37]/20">
              <div className="flex items-center justify-between bg-[#0B1420] px-3 py-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#D4AF37]">
                  {match?.[1] || 'code'}
                </span>
                <CopyButton text={codeString} />
              </div>
              <SyntaxHighlighter
                language={match?.[1] || 'text'}
                style={oneDark}
                customStyle={{ margin: 0, background: '#0d1522', fontSize: '13px', padding: '12px' }}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
});

// ---------- Single chat bubble, memoized ----------
// Only re-renders when its own text/streaming state actually changes —
// NOT when other messages update or new ones are added.
const ChatMessage = memo(
  function ChatMessage({ message, isStreaming }) {
    const textContent = useMemo(
      () => message.parts?.filter((p) => p.type === 'text').map((p) => p.text).join('') || '',
      [message.parts]
    );

    return (
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`
            group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${
              message.role === 'user'
                ? 'bg-[#D4AF37] text-[#0B1420] rounded-br-sm'
                : 'bg-[#111C2F] text-white border-l-2 border-[#D4AF37] rounded-bl-sm'
            }
          `}
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <span
              className={`text-[11px] font-medium uppercase tracking-wider ${
                message.role === 'user' ? 'text-[#0B1420]/60' : 'text-[#D4AF37]'
              }`}
            >
              {message.role === 'user' ? 'You' : 'Habeeb Innovative AI'}
            </span>
            {message.role !== 'user' && !isStreaming && (
              <span className="opacity-0 transition group-hover:opacity-100">
                <CopyButton text={textContent} />
              </span>
            )}
          </div>

          {message.role === 'user' ? (
            <div className="whitespace-pre-wrap">{textContent}</div>
          ) : isStreaming ? (
            // Cheap plain-text render while tokens are still arriving —
            // avoids re-parsing markdown/syntax-highlighting on every token
            <div className="whitespace-pre-wrap">{textContent}</div>
          ) : (
            <MessageContent text={textContent} />
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Skip re-render entirely if nothing relevant changed
    const prevText = prevProps.message.parts?.map((p) => p.text).join('') || '';
    const nextText = nextProps.message.parts?.map((p) => p.text).join('') || '';
    return (
      prevText === nextText &&
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.message.role === nextProps.message.role
    );
  }
);

export default function App() {
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const userId = useRef(getUserId()).current;

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `${API_BASE}/api/chat`,
      body: () => ({
        conversationId: activeId,
        userId,
      }),
    }),
  });

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const rafRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations?userId=${userId}`);
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (status === 'ready') refreshConversations();
  }, [status, refreshConversations]);

  // Throttled auto-scroll via requestAnimationFrame instead of firing
  // a smooth-scroll on every single token update
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [messages, status]);

  const startNewChat = useCallback(() => {
    setActiveId(crypto.randomUUID());
    setMessages([]);
    setSidebarOpen(false);
  }, [setMessages]);

  const loadConversation = async (conv) => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${conv._id}`);
      const data = await res.json();
      setActiveId(data._id);
      setMessages(data.messages);
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (id === activeId) startNewChat();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!activeId) setActiveId(crypto.randomUUID());
    sendMessage({ text: input });
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const isBusy = status !== 'ready';

  return (
    <div className="flex h-screen bg-[#0B1420]">
      <aside
        className={`
          fixed inset-y-0 left-0 z-20 w-72 transform border-r border-[#D4AF37]/20 bg-[#0B1420] transition-transform duration-200
          sm:relative sm:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col p-3">
          <button
            onClick={startNewChat}
            className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 py-2.5 text-sm font-medium text-[#D4AF37] transition hover:bg-[#111C2F]"
          >
            + New Chat
          </button>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {loadingConversations && (
              <p className="px-3 py-2 text-xs text-[#8592AA]">Loading history…</p>
            )}
            {!loadingConversations && conversations.length === 0 && (
              <p className="px-3 py-2 text-xs text-[#8592AA]">No conversations yet.</p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => loadConversation(conv)}
                className={`
                  group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition
                  ${conv._id === activeId ? 'bg-[#111C2F] text-white' : 'text-[#8592AA] hover:bg-[#111C2F]/60'}
                `}
              >
                <span className="truncate">{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(conv._id, e)}
                  className="ml-2 shrink-0 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black/50 sm:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 flex-col">
        <header className="shrink-0 border-b border-[#D4AF37]/30 bg-[#0B1420] px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-[#D4AF37] sm:hidden">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#111C2F] text-[#D4AF37] font-semibold text-sm">
              HI
            </div>
            <div className="flex flex-col">
              <h1 className="text-[15px] sm:text-base font-semibold tracking-wide text-white">
                Habeeb Innovative AI
              </h1>
              <span className="flex items-center gap-1.5 text-xs text-[#8592AA]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isBusy ? 'bg-[#D4AF37] animate-pulse' : 'bg-[#D4AF37]/60'
                  }`}
                />
                {isBusy ? 'Thinking…' : 'Online'}
              </span>
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.length === 0 && (
              <div className="mt-10 flex flex-col items-center text-center">
                <div className="mb-4 h-px w-16 bg-[#D4AF37]/40" />
                <p className="text-sm text-[#8592AA]">
                  Ask Habeeb Innovative AI anything to get started.
                </p>
              </div>
            )}

            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const isStreaming = isLast && m.role === 'assistant' && isBusy;
              return <ChatMessage key={m.id} message={m} isStreaming={isStreaming} />;
            })}

            {isBusy && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border-l-2 border-[#D4AF37] bg-[#111C2F] px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37] [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37]" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#D4AF37]/30 bg-[#0B1420] px-4 py-4 sm:px-6">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              className="max-h-40 flex-1 resize-none rounded-xl border border-[#D4AF37]/30 bg-[#111C2F] px-4 py-3 text-sm text-white placeholder-[#8592AA] outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Habeeb Innovative AI... (Shift+Enter for new line)"
              disabled={isBusy}
            />
            <button
              type="submit"
              disabled={isBusy || !input.trim()}
              className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#0B1420] transition hover:bg-[#F1D786] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}