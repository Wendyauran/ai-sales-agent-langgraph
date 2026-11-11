"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleLogin(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError("Email atau Password salah");
        }

        setIsSubmitting(false);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            <form
                onSubmit={handleLogin}
                className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-xl"
            >
                <h1 className="text-xl font-bold text-zinc-900">Admin Login</h1>

                {error && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <input 
                    type="email" 
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    required
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
                />
                <input 
                    type="password" 
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    required
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-black"
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isSubmitting ? "Memproses..." : "Login"}
                </button>
            </form>
        </div>
    );
}

type Lead = {
  id: string;
  name: string | null;
  business_type: string | null;
  budget_range: string | null;
  timeline: string | null;
  status: string;
};

type Booking = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  leads: { name: string | null } | null;
};

type Escalation = {
  id: string;
  reason: string;
  status: string;
  leads: { name: string | null } | null;
};

function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [leadsResult, bookingsResult, escalationsResult] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*, leads(name)").order("scheduled_at", { ascending: false }),
        supabase.from("escalations").select("*, leads(name)").order("created_at", { ascending: false }),
      ]);

      setLeads(leadsResult.data ?? []);
      setBookings(bookingsResult.data ?? []);
      setEscalations(escalationsResult.data ?? []);
      setLoading(false);
    }

    loadData();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="p-8">Memuat data...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          Logout
        </button>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Leads ({leads.length})</h2>
        <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm">
          <thead className="bg-zinc-100 text-left">
            <tr>
              <th className="px-4 py-2 text-zinc-700">Nama</th>
              <th className="px-4 py-2 text-zinc-700">Jenis Bisnis</th>
              <th className="px-4 py-2 text-zinc-700">Budget</th>
              <th className="px-4 py-2 text-zinc-700">Timeline</th>
              <th className="px-4 py-2 text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-900">{lead.name ?? "-"}</td>
                <td className="px-4 py-2 text-zinc-900">{lead.business_type ?? "-"}</td>
                <td className="px-4 py-2 text-zinc-900">{lead.budget_range ?? "-"}</td>
                <td className="px-4 py-2 text-zinc-900">{lead.timeline ?? "-"}</td>
                <td className="px-4 py-2 text-zinc-900">{lead.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Bookings ({bookings.length})</h2>
        <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm">
          <thead className="bg-zinc-100 text-left">
            <tr>
              <th className="px-4 py-2 text-zinc-700">Lead</th>
              <th className="px-4 py-2 text-zinc-700">Jadwal</th>
              <th className="px-4 py-2 text-zinc-700">Durasi</th>
              <th className="px-4 py-2 text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-900">{booking.leads?.name ?? "-"}</td>
                <td className="px-4 py-2 text-zinc-900">{new Date(booking.scheduled_at).toLocaleString("id-ID")}</td>
                <td className="px-4 py-2 text-zinc-900">{booking.duration_minutes} menit</td>
                <td className="px-4 py-2 text-zinc-900">{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Escalations ({escalations.length})</h2>
        <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow-sm">
          <thead className="bg-zinc-100 text-left">
            <tr>
              <th className="px-4 py-2 text-zinc-700">Lead</th>
              <th className="px-4 py-2 text-zinc-700">Alasan</th>
              <th className="px-4 py-2 text-zinc-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {escalations.map((escalation) => (
              <tr key={escalation.id} className="border-t border-zinc-100">
                <td className="px-4 py-2 text-zinc-900">{escalation.leads?.name ?? "-"}</td>
                <td className="px-4 py-2 text-zinc-900">{escalation.reason}</td>
                <td className="px-4 py-2 text-zinc-900">{escalation.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function AdminPage() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Memuat...</div>;
    }

    if (!session) {
        return <LoginForm />;
    }

    return <Dashboard />;
}