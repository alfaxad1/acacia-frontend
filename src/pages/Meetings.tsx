import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, CheckCircle2, Clock, Lock, Plus, UserX } from "lucide-react";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatDateTime } from "../utils/format";
import { membersApi } from "../services/api";
import {
  AttendanceLine,
  AttendanceStatus,
  AttendanceSummary,
  ChamaEvent,
  eventsApi,
} from "../services/saasApi";
import type { Member } from "../types";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-rose-100 text-rose-700",
  EXCUSED: "bg-slate-100 text-slate-600",
};

export default function Meetings() {
  const [events, setEvents] = useState<ChamaEvent[]>([]);
  const [selected, setSelected] = useState<ChamaEvent | null>(null);
  const [register, setRegister] = useState<AttendanceLine[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    agenda: "",
    venue: "",
    startsAt: "",
    quorum: "",
    latenessGraceMinutes: "15",
  });

  const memberNames = useMemo(() => {
    const map = new Map<number, string>();
    members.forEach((m) => map.set(m.id, m.fullName ?? `Member #${m.id}`));
    return map;
  }, [members]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsRes, memberList] = await Promise.all([
        eventsApi.upcoming(),
        membersApi.getAll(),
      ]);
      setEvents(eventsRes.data);
      setMembers(memberList);
    } catch {
      setError("Could not load meetings");
    } finally {
      setLoading(false);
    }
  };

  const openEvent = async (event: ChamaEvent) => {
    setSelected(event);
    const [reg, sum] = await Promise.all([
      eventsApi.register(event.id),
      eventsApi.summary(event.id),
    ]);
    setRegister(reg.data);
    setSummary(sum.data);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const refreshRegister = async (eventId: number) => {
    const [reg, sum] = await Promise.all([
      eventsApi.register(eventId),
      eventsApi.summary(eventId),
    ]);
    setRegister(reg.data);
    setSummary(sum.data);
  };

  const handleCheckIn = async (memberId: number) => {
    if (!selected) return;
    try {
      await eventsApi.checkIn(selected.id, memberId);
      await refreshRegister(selected.id);
      toast.success("Checked in");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Check-in failed");
    }
  };

  const handleMark = async (memberId: number, status: AttendanceStatus) => {
    if (!selected) return;
    try {
      await eventsApi.mark(selected.id, memberId, status);
      await refreshRegister(selected.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not update the register");
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    try {
      const result = await eventsApi.close(selected.id);
      toast.success(
        result.finesIssued > 0
          ? `Register closed, ${result.finesIssued} fine(s) issued`
          : "Register closed, no fines due",
      );
      await refreshRegister(selected.id);
      await loadEvents();
      setSelected({ ...selected, registerClosed: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not close the register");
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.startsAt) {
      toast.error("A title and start time are required");
      return;
    }
    try {
      const created = await eventsApi.create({
        title: form.title,
        agenda: form.agenda,
        venue: form.venue,
        startsAt: form.startsAt,
        quorum: form.quorum ? Number(form.quorum) : undefined,
        latenessGraceMinutes: Number(form.latenessGraceMinutes || 15),
      });
      toast.success("Meeting scheduled");
      setCreateOpen(false);
      setForm({ title: "", agenda: "", venue: "", startsAt: "", quorum: "", latenessGraceMinutes: "15" });
      await loadEvents();
      await openEvent(created);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not schedule the meeting");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadEvents} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings &amp; attendance</h1>
          <p className="text-sm text-gray-500">
            Close the register to bill absence and lateness fines automatically.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} /> Schedule meeting
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          {events.length === 0 && (
            <p className="text-sm text-gray-500">No upcoming meetings yet.</p>
          )}
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => openEvent(event)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selected?.id === event.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2 text-gray-900 font-semibold">
                <CalendarDays size={16} /> {event.title}
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatDateTime(event.startsAt)}</p>
              {event.registerClosed && (
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
                  <Lock size={12} /> register closed
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected && (
            <div className="p-8 bg-white rounded-xl border border-dashed text-center text-gray-500">
              Pick a meeting to open its register.
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{selected.title}</h2>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(selected.startsAt)}
                    {selected.venue ? ` · ${selected.venue}` : ""}
                  </p>
                </div>
                {summary && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-700">{summary.present} present</span>
                    <span className="text-amber-700">{summary.late} late</span>
                    <span className="text-rose-700">{summary.absent} absent</span>
                    <span className="text-slate-600">{summary.excused} excused</span>
                    <span
                      className={`px-2 py-1 rounded-md font-semibold ${
                        summary.quorumMet ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {summary.quorumMet ? "Quorum met" : "No quorum"}
                    </span>
                  </div>
                )}
                {!selected.registerClosed && (
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black"
                  >
                    <Lock size={16} /> Close register
                  </button>
                )}
              </div>

              <div className="divide-y">
                {register.map((line) => (
                  <div key={line.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {memberNames.get(line.memberId) ?? `Member #${line.memberId}`}
                      </p>
                      {line.checkedInAt && (
                        <p className="text-xs text-gray-500">
                          checked in {formatDateTime(line.checkedInAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${STATUS_STYLES[line.status]}`}
                      >
                        {line.status}
                      </span>
                      {!selected.registerClosed && (
                        <>
                          <button
                            title="Check in"
                            onClick={() => handleCheckIn(line.memberId)}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            title="Mark excused"
                            onClick={() => handleMark(line.memberId, "EXCUSED")}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          >
                            <Clock size={16} />
                          </button>
                          <button
                            title="Mark absent"
                            onClick={() => handleMark(line.memberId, "ABSENT")}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                          >
                            <UserX size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} title="Schedule a meeting">
        <div className="space-y-4">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Title, e.g. September monthly meeting"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            type="datetime-local"
            className="w-full border rounded-lg px-3 py-2"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Venue"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Agenda"
            value={form.agenda}
            onChange={(e) => setForm({ ...form, agenda: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Quorum"
              value={form.quorum}
              onChange={(e) => setForm({ ...form, quorum: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Lateness grace (minutes)"
              value={form.latenessGraceMinutes}
              onChange={(e) => setForm({ ...form, latenessGraceMinutes: e.target.value })}
            />
          </div>
          <button
            onClick={handleCreate}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Schedule
          </button>
        </div>
      </Modal>
    </div>
  );
}
