'use client';

import { useState } from 'react';

interface Chat {
  id: string;
  title: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', title: 'Chat 1' },
    { id: '2', title: 'Chat 2' },
  ]);
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id || null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [inputText, setInputText] = useState('');

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat ${chats.length + 1}`,
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setMessages({ ...messages, [newChat.id]: [] });
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      timestamp: new Date(),
    };

    const chatMessages = messages[activeChatId] || [];
    setMessages({
      ...messages,
      [activeChatId]: [...chatMessages, newMessage],
    });

    setInputText('');
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
      <header className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Magus
        </h1>
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
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-3xl space-y-4">
                  {(messages[activeChatId] || []).map((message) => (
                    <div
                      key={message.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <p className="text-black dark:text-white whitespace-pre-wrap">
                        {message.text}
                      </p>
                    </div>
                  ))}
                  {(!messages[activeChatId] || messages[activeChatId].length === 0) && (
                    <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-6 dark:border-gray-800">
                <div className="mx-auto max-w-3xl">
                  <div className="flex gap-4">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-500 focus:border-black focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white"
                      rows={1}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className="rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                      Send
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

