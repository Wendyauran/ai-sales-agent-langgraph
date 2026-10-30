import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-zinc-50 px-4 py-12 md:flex-row md:gap-16">
      <div className="max-w-sm text-center md:text-left">
        <h1 className="text-2xl font-bold text-zinc-900">XYZ Studio</h1>
        <p className="mt-2 text-zinc-600">Punya ide website? Ngobrol aja dulu.</p>
      </div>

      <ChatWidget />
    </div>
  );
}