'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Chat {
  id: string;
  title: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isUser?: boolean;
}

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', title: 'Chat 1' },
    { id: '2', title: 'Chat 2' },
  ]);
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id || null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    document.title = 'Magus - Chat';
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      // Still redirect even if logout fails
      router.push('/login');
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat ${chats.length + 1}`,
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setMessages({ ...messages, [newChat.id]: [] });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChatId) return;

    const userPrompt = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userPrompt,
      timestamp: new Date(),
      isUser: true,
    };

    const chatMessages = messages[activeChatId] || [];
    const updatedMessages = [...chatMessages, userMessage];
    
    setMessages({
      ...messages,
      [activeChatId]: updatedMessages,
    });

    setInputText('');

    // Call backend API to get response
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      const data = await response.json();

      if (response.ok && data.message) {
        const apiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          timestamp: new Date(),
          isUser: false,
        };

        setMessages((prevMessages) => {
          const currentChatMessages = prevMessages[activeChatId] || [];
          return {
            ...prevMessages,
            [activeChatId]: [...currentChatMessages, apiMessage],
          };
        });
      } else {
        console.error('Failed to get response from API:', data.error);
      }
    } catch (error) {
      console.error('Error calling chat API:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-black">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 dark:border-gray-800 dark:from-gray-900 dark:to-black">
        <div className="flex-1"></div>
        <h1 className="flex-1 text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
          Magus
        </h1>
        <div className="flex flex-1 justify-end">
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-black dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeChatId === chat.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div className="truncate text-black dark:text-white">
                    {chat.title}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col">
          {activeChatId ? (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-950">
                <div className="mx-auto max-w-3xl space-y-2">
                  {(messages[activeChatId] || []).map((message) => {
                    const isUser = message.isUser ?? true; // Default to user if not specified
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isUser
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm border border-gray-200 dark:border-gray-700'
                          }`}
                          style={{
                            borderRadius: isUser
                              ? '1rem 1rem 1rem 0.25rem'
                              : '1rem 1rem 0.25rem 1rem',
                          }}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {message.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!messages[activeChatId] || messages[activeChatId].length === 0) && (
                    <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 bg-white dark:bg-gray-900 p-4 dark:border-gray-800">
                <div className="mx-auto max-w-3xl">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type a message"
                      className="flex-1 resize-none rounded-full border border-gray-300 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                      rows={1}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className="rounded-full bg-blue-500 p-3 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500"
                      title="Send"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Select a chat or create a new one to start messaging</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

