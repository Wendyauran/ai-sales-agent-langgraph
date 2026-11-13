import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-linear-to-br from-indigo-50 via-white to-violet-50 px-4 py-12 md:flex-row md:gap-16">
      <div className="max-w-sm text-center md:text-left">
        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-teal-700">
          Jasa Pembuatan Website
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">XYZ Studio</h1>
        <p className="mt-2 text-zinc-600">
          Punya ide website? Konsultasikan dengan kami — kami bantu wujudkan dari landing page sampai aplikasi custom.
        </p>
      </div>

      <ChatWidget />
    </div>
  );
}