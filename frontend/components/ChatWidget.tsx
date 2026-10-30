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
        <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="bg-indigo-600 px-4 py-3 font-semibold text-white">
            💬 Chat dengan XYZ Studio
        </div>

        <div className="flex h-96 flex-col gap-3 overflow-y-auto bg-zinc-50 p-4">
            {messages.length === 0 && (
            <div className="self-start rounded-2xl bg-white px-4 py-2 text-sm text-zinc-500 shadow-sm">
                Halo! Ada yang bisa kami bantu soal website Anda?
            </div>
            )}
            {messages.map((message, index) => (
            <div
                key={index}
                className={
                message.role === "user"
                    ? "self-end rounded-2xl bg-indigo-600 px-4 py-2 text-sm text-white"
                    : "self-start rounded-2xl bg-white px-4 py-2 text-sm text-zinc-800 shadow-sm"
                }
            >
                {message.content}
            </div>
            ))}
            {isLoading && (
            <div className="self-start rounded-2xl bg-white px-4 py-2 text-sm text-zinc-400 shadow-sm">
                Mengetik...
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
            className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm text-black focus:border-indigo-500 focus:outline-none"
            disabled={isLoading}
            />
            <button
            onClick={sendMessage}
            disabled={isLoading}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
            Kirim
            </button>
        </div>
        </div>
    );
}