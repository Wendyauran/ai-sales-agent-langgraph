"use client";

import React, { useState } from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function ChatWidget() {
    const [messages, setMessage] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function sendMessage() {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: Message = { role: "user", content: trimmed };
        setMessage((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    message: trimmed
                })
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setConversationId(data.conversation_id);
            setMessage((prev) => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error) {
            setMessage((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kendala koneksi. Coba lagi ya."}]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            sendMessage();
        }
    }

  return (
    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
      <div className="flex items-center gap-3 bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
          🤖
        </div>
        <div>
          <div className="font-semibold text-white">XYZ Studio Assistant</div>
          <div className="flex items-center gap-1 text-xs text-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Online
          </div>
        </div>
      </div>

      <div className="flex h-96 flex-col gap-4 overflow-y-auto bg-zinc-50 p-4">
        {messages.length === 0 && (
          <div className="flex items-end gap-2 self-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm text-white">
              🤖
            </div>
            <div className="max-w-65 rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm">
              Halo! Ada yang bisa kami bantu soal website Anda?
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "flex items-end justify-end gap-2 self-end"
                : "flex items-end gap-2 self-start"
            }
          >
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm text-white">
                🤖
              </div>
            )}
            <div
                className={
                    message.role === "user"
                    ? "max-w-65 min-w-0 wrap-break-word rounded-2xl rounded-br-sm bg-linear-to-br from-indigo-600 to-violet-600 px-4 py-2 text-sm text-white shadow-sm"
                    : "max-w-65 min-w-0 wrap-break-word rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-sm text-zinc-800 shadow-sm"
                }
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-end gap-2 self-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm text-white">
              🤖
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-zinc-200 bg-white p-3">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan..."
          className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="rounded-full bg-linear-to-br from-indigo-600 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}