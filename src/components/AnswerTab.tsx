import React, { useState } from "react";
import { Jawaban, Komentar } from "../types";
import FileViewer from "./FileViewer";
import { 
  Calendar, 
  MessageSquare, 
  Trash2, 
  X, 
  User, 
  FileUp, 
  Send, 
  Share2, 
  ArrowRight,
  Sparkles,
  Info 
} from "lucide-react";

interface AnswerTabProps {
  jawabanList: Jawaban[];
  isAdmin: boolean;
  adminToken: string | null;
  onRefresh: () => Promise<void>;
}

export default function AnswerTab({ jawabanList, isAdmin, adminToken, onRefresh }: AnswerTabProps) {
  // Post/Share Answer Form Toggle
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [namaPengirim, setNamaPengirim] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Detailed Modal/Drawer state
  const [activeAnswer, setActiveAnswer] = useState<Jawaban | null>(null);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // File loading helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileData(null);
      setFileName(null);
      setFileMime(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      setError("Ukuran file terlalu besar. Maksimal 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      setFileName(file.name);
      setFileMime(file.type);
      setError("");
    };
    reader.onerror = () => {
      setError("Gagal membaca file.");
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setJudul("");
    setDeskripsi("");
    setNamaPengirim("");
    setFileData(null);
    setFileName(null);
    setFileMime(null);
    setError("");
    setIsFormOpen(false);
  };

  // Submit Answer
  const handleShareAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) {
      setError("Judul dan deskripsi wajib diisi.");
      return;
    }
    if (!fileData) {
      setError("Anda wajib melampirkan file foto atau PDF tugas Anda.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/jawaban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          namaPengirim: namaPengirim.trim(),
          fileData,
          fileName,
          fileMime,
        }),
      });

      if (response.ok) {
        await onRefresh();
        resetForm();
      } else {
        const data = await response.json();
        setError(data.error || "Gagal membagikan jawaban.");
      }
    } catch (err) {
      setError("Koneksi internet bermasalah. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Post Comment on Answer
  const handlePostComment = async (e: React.FormEvent, answerId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const response = await fetch(`/api/jawaban/${answerId}/komentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: commentName.trim(),
          teks: commentText.trim(),
        }),
      });

      if (response.ok) {
        setCommentText("");
        await onRefresh();
        // Update local detail view comments instantly
        const updatedList = await fetch("/api/forum").then((res) => res.json());
        const updatedAnswer = updatedList.jawaban?.find((j: Jawaban) => j.id === answerId);
        if (updatedAnswer) {
          setActiveAnswer(updatedAnswer);
        }
      }
    } catch (err) {
      console.error("Comment posting error:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  // Delete Answer (Admin only)
  const handleDeleteAnswer = async (answerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus postingan jawaban ini secara permanen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/jawaban/${answerId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": adminToken || "",
        },
      });

      if (response.ok) {
        if (activeAnswer?.id === answerId) {
          setActiveAnswer(null);
        }
        await onRefresh();
      } else {
        const errData = await response.json();
        alert(errData.error || "Gagal menghapus jawaban.");
      }
    } catch (err) {
      alert("Gagal menghubungi server.");
    }
  };

  // Delete Comment (Admin only)
  const handleDeleteComment = async (answerId: string, commentId: string) => {
    if (!window.confirm("Hapus komentar ini secara permanen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/jawaban/${answerId}/komentar/${commentId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": adminToken || "",
        },
      });

      if (response.ok) {
        await onRefresh();
        // Update active modal view comment array
        const updatedList = await fetch("/api/forum").then((res) => res.json());
        const updatedAnswer = updatedList.jawaban?.find((j: Jawaban) => j.id === answerId);
        if (updatedAnswer) {
          setActiveAnswer(updatedAnswer);
        }
      } else {
        alert("Gagal menghapus komentar.");
      }
    } catch (err) {
      alert("Gagal menghubungi server.");
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-5">
      {/* Universal Share Answer Block */}
      <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-gradient-to-tr from-emerald-50/70 to-teal-50/30 dark:from-emerald-951/30 dark:to-teal-951/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase block">
              Kolaborasi Mahasiswa
            </span>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-205">
              Punya kerjaan tugas yang mau didiskusikan? Bagikan ke teman-teman!
            </h2>
          </div>
          {!isFormOpen && (
            <button
              id="add-answer-toggle-btn"
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Bagikan Jawaban
            </button>
          )}
        </div>

        {isFormOpen && (
          <form onSubmit={handleShareAnswer} className="mt-5 space-y-4 pt-4 border-t border-emerald-100/60 dark:border-emerald-900/40 animate-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                BAGIKAN JAWABAN TUGAS
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {error && (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-3 rounded-lg flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Judul Postingan Jawaban
                </label>
                <input
                  id="answer-title-input"
                  type="text"
                  required
                  placeholder="Contoh: Jawaban Tugas B.Inggris Pertemuan 5"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Nama Anda / Pengonsep (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4/5" />
                  </div>
                  <input
                    id="answer-author-input"
                    type="text"
                    placeholder="Kosongkan jika ingin Anonim"
                    value={namaPengirim}
                    onChange={(e) => setNamaPengirim(e.target.value)}
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans"
                    maxLength={30}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Deskripsi / Catatan Pengerjaan
              </label>
              <textarea
                id="answer-desc-input"
                required
                rows={3}
                placeholder="Deskripsikan jawaban Anda, penafsiran rumus, atau catatan diskusi..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Lampiran Hasil Kerjaan (Foto / PDF) - <span className="text-emerald-700 dark:text-emerald-400 font-bold">Wajib</span>
              </label>
              <div className="relative flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors">
                <input
                  id="answer-file-input"
                  type="file"
                  required
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <FileUp className="w-6 h-6 mx-auto text-slate-400 dark:text-slate-500 mb-1" />
                  <p className="text-xs font-semibold text-slate-750 dark:text-slate-350">
                    {fileName ? `Terlampir: ${fileName}` : "Klik / Tarik foto kerjaan atau file PDF tugas Anda"}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    Format: PNG, JPG, JPEG, atau PDF (maks 15MB)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                id="answer-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/15 transition-all cursor-pointer"
              >
                {isSubmitting ? "Mengirim..." : "Kirim & Bagikan"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Shared Answers Listings */}
      <div className="space-y-3">
        {jawabanList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-805 p-6 space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-655 animate-pulse" />
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Belum Ada Jawaban Dibagikan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Jadilah mahasiswa pertama yang membagikan kontribusi pengerjaan tugas!
              </p>
            </div>
          </div>
        ) : (
          jawabanList.map((answer) => (
            <div
              key={answer.id}
              onClick={() => {
                setActiveAnswer(answer);
                setCommentText("");
              }}
              className="group relative bg-white dark:bg-slate-900 block rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 hover:border-emerald-100 dark:hover:border-emerald-900/50 hover:shadow-xs transition-all duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1 max-w-[85%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                      Oleh: {answer.namaPengirim}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors pt-1">
                    {answer.judul}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {answer.deskripsi}
                  </p>
                </div>

                {/* Trash Icon for Admin Moderation */}
                {isAdmin && (
                  <button
                    onClick={(e) => handleDeleteAnswer(answer.id, e)}
                    className="p-2 text-slate-400 dark:text-slate-550 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all duration-200 self-start cursor-pointer"
                    title="Hapus Jawaban"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>

              {/* Badges bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800/60 text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500" />
                  {formatDate(answer.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500" />
                  {answer.komentar?.length || 0} Komentar
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-305 text-[10px] font-sans font-semibold">
                  File {answer.fileType?.includes("pdf") ? "PDF" : "Foto"}
                </span>
                <span className="text-emerald-650 dark:text-emerald-400 font-semibold flex items-center gap-0.5 ml-auto group-hover:translate-x-0.5 transition-transform font-sans">
                  Selesaikan Diskusi
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Answer Detail Overlay Slide Sheet */}
      {activeAnswer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setActiveAnswer(null)}
          />

          {/* Panel Card Container */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-150 dark:border-slate-800 h-screen flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-305 text-[10px] font-bold rounded-full uppercase tracking-widest font-mono">
                FORUM DETAIL JAWABAN
              </span>
              <button
                id="answer-detail-close-btn"
                onClick={() => setActiveAnswer(null)}
                className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Tutup Detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {" "}
              {/* Answer content description */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-850 dark:text-emerald-400 text-xs font-bold rounded-md">
                    Oleh: {activeAnswer.namaPengirim}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Dibagikan {formatDate(activeAnswer.createdAt)}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-50 leading-snug">
                  {activeAnswer.judul}
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {activeAnswer.deskripsi}
                </p>

                {/* Visual Attachment */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Lampiran Jawaban Terkirim (Wajib):
                  </span>
                  <FileViewer 
                    fileUrl={activeAnswer.fileUrl} 
                    fileName={activeAnswer.fileName} 
                    fileType={activeAnswer.fileType} 
                  />
                </div>
              </div>

              {/* Comment Thread */}
              <div className="pt-6 border-t border-slate-100/85 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  Diskusi Komentar ({activeAnswer.komentar?.length || 0})
                </h3>

                <div className="space-y-3">
                  {(!activeAnswer.komentar || activeAnswer.komentar.length === 0) ? (
                    <p className="text-xs text-center py-6 text-slate-400 dark:text-slate-500 italic">
                      Belum ada tanggapan komentar. Ayo share opini kerjaan Anda!
                    </p>
                  ) : (
                    activeAnswer.komentar.map((comment) => (
                      <div 
                        key={comment.id}
                        className="group/comment relative p-3.5 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/45 dark:bg-slate-850/45 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 max-w-[85%]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-205">
                                {comment.nama}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                              {comment.teks}
                            </p>
                          </div>

                          {/* Delete Comment (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(activeAnswer.id, comment.id)}
                              className="opacity-0 group-hover/comment:opacity-100 p-1.5 text-slate-400 dark:text-slate-555 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg transition-all cursor-pointer"
                              title="Hapus Komentar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {" "}
            {/* Static Bottom Input Comments Panel */}
            <div className="border-t border-slate-150 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shrink-0 shadow-lg">
              <form onSubmit={(e) => handlePostComment(e, activeAnswer.id)} className="space-y-2.5">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-sans">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <input
                    id="ans-comment-name-input"
                    type="text"
                    placeholder="Nama Anda (Kosong = Anonim)"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full text-xs font-medium text-slate-755 dark:text-slate-200 bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans shadow-2xs"
                    maxLength={30}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    id="ans-comment-text-input"
                    required
                    rows={2}
                    placeholder="Tulis tanggapan / komentar Anda..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-225 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-sans resize-none"
                    maxLength={1000}
                  />
                  <button
                    id="ans-comment-submit-btn"
                    type="submit"
                    disabled={isCommenting || !commentText.trim()}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                    title="Kirim Komentar"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
