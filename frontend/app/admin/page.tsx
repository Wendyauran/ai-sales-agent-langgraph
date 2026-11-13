"use client";

import { AlertTriangle, Calendar, UserCog, Users } from "lucide-react";
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

function statusBadgeClass(status: string): string {
  switch (status) {
    case "qualified":
      return "bg-blue-100 text-blue-700";
    case "booked":
    case "completed":
    case "resolved":
      return "bg-emerald-100 text-emerald-700";
    case "scheduled":
      return "bg-indigo-100 text-indigo-700";
    case "escalated":
    case "open":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    case "rescheduled":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

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
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between bg-linear-to-r from-teal-600 to-cyan-600 px-8 py-5 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <UserCog className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
        >
          Logout
        </button>
      </header>

      <div className="p-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-sm text-zinc-500">Total Leads</div>
              <div className="text-2xl font-bold text-zinc-900">{leads.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-zinc-500">Booking Terjadwal</div>
              <div className="text-2xl font-bold text-zinc-900">
                {bookings.filter((b) => b.status === "scheduled").length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-zinc-500">Eskalasi Terbuka</div>
              <div className="text-2xl font-bold text-zinc-900">
                {escalations.filter((e) => e.status === "open").length}
              </div>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Calon Klien</h2>
          <div className="overflow-hidden rounded-lg shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-teal-700 text-left text-teal-50">
                <tr>
                  <th className="w-12 px-4 py-3">No.</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Jenis Bisnis</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Timeline</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {leads.map((lead, index) => (
                  <tr key={lead.id} className="border-b border-zinc-100 even:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-3 text-zinc-900">{lead.name ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-900">{lead.business_type ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-900">{lead.budget_range ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-900">{lead.timeline ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Jadwal Meeting</h2>
          <div className="overflow-hidden rounded-lg shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-teal-700 text-left text-teal-50">
                <tr>
                  <th className="w-12 px-4 py-3">No.</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3">Durasi</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {bookings.map((booking, index) => (
                  <tr key={booking.id} className="border-b border-zinc-100 even:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-3 text-zinc-900">{booking.leads?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-900">{new Date(booking.scheduled_at).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-zinc-900">{booking.duration_minutes} menit</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Eskalasi</h2>
          <div className="overflow-hidden rounded-lg shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-teal-700 text-left text-teal-50">
                <tr>
                  <th className="w-12 px-4 py-3">No.</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Alasan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {escalations.map((escalation, index) => (
                  <tr key={escalation.id} className="border-b border-zinc-100 even:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-3 text-zinc-900">{escalation.leads?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-900">{escalation.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(escalation.status)}`}>
                        {escalation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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