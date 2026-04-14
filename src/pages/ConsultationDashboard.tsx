import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

type ConsultationRequest = {
  id: string;
  resident_name: string;
  resident_phone: string;
  vendor_name: string;
  vendor_type: string;
  complex_name: string;
  preferred_time: string;
  status: string;
  memo: string;
  created_at: string;
};

const STATUS_FILTERS = ["전체", "대기중", "처리완료"] as const;
const DATE_FILTERS = ["전체", "오늘", "이번주", "이번달"] as const;

export default function ConsultationDashboard() {
  const [data, setData] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [dateFilter, setDateFilter] = useState<string>("전체");
  const [selected, setSelected] = useState<ConsultationRequest | null>(null);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("consultation_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("데이터를 불러오지 못했습니다.");
    } else {
      setData((rows as ConsultationRequest[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("consultation_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "consultation_requests" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const getDateRange = (filter: string): Date | null => {
    const now = new Date();
    if (filter === "오늘") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (filter === "이번주") {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (filter === "이번달") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return null;
  };

  const filtered = data.filter((r) => {
    if (statusFilter !== "전체" && r.status !== statusFilter) return false;
    const dateStart = getDateRange(dateFilter);
    if (dateStart && new Date(r.created_at) < dateStart) return false;
    return true;
  });

  const openModal = (row: ConsultationRequest) => {
    setSelected(row);
    setMemo(row.memo || "");
  };

  const toggleStatus = async () => {
    if (!selected) return;
    const newStatus = selected.status === "대기중" ? "처리완료" : "대기중";
    setSaving(true);
    const { error } = await supabase
      .from("consultation_requests")
      .update({ status: newStatus } as any)
      .eq("id", selected.id);
    if (error) {
      toast.error("상태 변경 실패");
    } else {
      setSelected({ ...selected, status: newStatus });
      toast.success(`상태가 "${newStatus}"로 변경되었습니다.`);
    }
    setSaving(false);
  };

  const saveMemo = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("consultation_requests")
      .update({ memo } as any)
      .eq("id", selected.id);
    if (error) {
      toast.error("메모 저장 실패");
    } else {
      setSelected({ ...selected, memo });
      toast.success("메모가 저장되었습니다.");
    }
    setSaving(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">상담신청 관리</h1>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </header>

      {/* Filters */}
      <div className="bg-white border-b px-6 py-3 flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex gap-1">
          {DATE_FILTERS.map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === d
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-500">
          총 {filtered.length}건
        </span>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-14 text-center">번호</TableHead>
                <TableHead>신청자명</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>업체명</TableHead>
                <TableHead>업체유형</TableHead>
                <TableHead>단지명</TableHead>
                <TableHead>희망시간</TableHead>
                <TableHead>신청일시</TableHead>
                <TableHead className="text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, i) => (
                  <TableRow
                    key={row.id}
                    onClick={() => openModal(row)}
                    className="cursor-pointer hover:bg-blue-50/50"
                  >
                    <TableCell className="text-center text-gray-500 text-sm">{i + 1}</TableCell>
                    <TableCell className="font-medium">{row.resident_name}</TableCell>
                    <TableCell className="text-sm">{row.resident_phone}</TableCell>
                    <TableCell className="text-sm">{row.vendor_name}</TableCell>
                    <TableCell className="text-sm">{row.vendor_type}</TableCell>
                    <TableCell className="text-sm">{row.complex_name}</TableCell>
                    <TableCell className="text-sm">{row.preferred_time}</TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(row.created_at)}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          row.status === "처리완료"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">상담 신청 상세</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow label="신청자명" value={selected.resident_name} />
              <InfoRow label="연락처" value={selected.resident_phone} />
              <InfoRow label="업체명" value={selected.vendor_name} />
              <InfoRow label="업체유형" value={selected.vendor_type} />
              <InfoRow label="단지명" value={selected.complex_name} />
              <InfoRow label="희망시간" value={selected.preferred_time} />
              <InfoRow label="신청일시" value={formatDate(selected.created_at)} />
              <div className="flex items-center justify-between">
                <span className="text-gray-500 w-20 shrink-0">상태</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      selected.status === "처리완료"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selected.status}
                  </span>
                  <Button size="sm" variant="outline" onClick={toggleStatus} disabled={saving}>
                    {selected.status === "대기중" ? "처리완료로 변경" : "대기중으로 변경"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-sm font-medium text-gray-700">메모</label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={3}
              />
              <Button size="sm" onClick={saveMemo} disabled={saving} className="w-full">
                메모 저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center">
      <span className="text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
