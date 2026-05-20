import React, { useState } from "react";
import { Tugas, Komentar } from "../types";
import FileViewer from "./FileViewer";
import { 
  Calendar, 
  MessageSquare, 
  Plus, 
  Trash2, 
  X, 
  User, 
  FileUp, 
  Send, 
  ArrowRight,
  BookOpen,
  Info
} from "lucide-react";

interface TaskTabProps {
  tugasList: Tugas[];
  isAdmin: boolean;
  adminToken: string | null;
  onRefresh: () => Promise<void>;
}

export default function TaskTab({ tugasList, isAdmin, adminToken, onRefresh }: TaskTabProps) {
  // Task form state (Admin only)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Detailed modal state keys
  const [activeTask, setActiveTask] = useState<Tugas | null>(null);
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
    setFileData(null);
    setFileName(null);
    setFileMime(null);
    setError("");
    setIsFormOpen(false);
  };

  // Create Task Submission
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !deskripsi.trim()) {
      setError("Judul dan Deskripsi tugas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/tugas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken || "",
        },
        body: JSON.stringify({
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
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
        setError(data.error || "Gagal membuat tugas baru.");
      }
    } catch (err) {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Post Comment
  const handlePostComment = async (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const response = await fetch(`/api/tugas/${taskId}/komentar`, {
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
        // Update local active modal view with the newest comment array
        const updatedList = await fetch("/api/forum").then((res) => res.json());
        const updatedTask = updatedList.tugas?.find((t: Tugas) => t.id === taskId);
        if (updatedTask) {
          setActiveTask(updatedTask);
        }
      }
    } catch (err) {
      console.error("Comment posting error:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal click
    if (!window.confirm("Apakah Anda yakin ingin menghapus tugas ini secara permanen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tugas/${taskId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": adminToken || "",
        },
      });

      if (response.ok) {
        if (activeTask?.id === taskId) {
          setActiveTask(null);
        }
        await onRefresh();
      } else {
        const errData = await response.json();
        alert(errData.error || "Gagal menghapus tugas.");
      }
    } catch (err) {
      alert("Gagal menghubungi server.");
    }
  };

  // Delete Comment inside Task
  const handleDeleteComment = async (taskId: string, commentId: string) => {
    if (!window.confirm("Hapus komentar ini secara permanen?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tugas/${taskId}/komentar/${commentId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Token": adminToken || "",
        },
      });

      if (response.ok) {
        await onRefresh();
        // Update local active modal view
        const updatedList = await fetch("/api/forum").then((res) => res.json());
        const updatedTask = updatedList.tugas?.find((t: Tugas) => t.id === taskId);
        if (updatedTask) {
          setActiveTask(updatedTask);
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
      {/* Admin Quick Action Block */}
      {isAdmin && (
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-tr from-indigo-50/70 to-blue-50/40 dark:from-indigo-955/30 dark:to-blue-955/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 tracking-wider uppercase block">
                Hak Akses Admin Aktif
              </span>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Halo Admin, Anda berhak memposting tugas & moderasi konten.
              </h2>
            </div>
            {!isFormOpen && (
              <button
                id="add-task-toggle-btn"
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Tugas
              </button>
            )}
          </div>

          {isFormOpen && (
            <form onSubmit={handleCreateTask} className="mt-5 space-y-4 pt-4 border-t border-indigo-100/60 dark:border-indigo-900/40 animate-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">
                  FORM POSTING TUGAS BARU
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

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Judul Tugas
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  placeholder="Contoh: Tugas Bahasa Inggris Pertemuan 5"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Instruksi / Deskripsi Tugas
                </label>
                <textarea
                  id="task-desc-input"
                  required
                  rows={4}
                  placeholder="Ketikkan detail instruksi, deadline, format penyerahan, dsb..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Lampiran Pendukung (Foto / PDF) - Opsional
                </label>
                <div className="relative flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors">
                  <input
                     id="task-file-input"
                     type="file"
                     accept="image/*,application/pdf"
                     onChange={handleFileChange}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <FileUp className="w-6 h-6 mx-auto text-slate-400 dark:text-slate-500 mb-1" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {fileName ? `File terpilih: ${fileName}` : "Klik / Tarik file Gambar atau PDF"}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                      Maksimal size file 15MB
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
                  id="task-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/15 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Memposting..." : "Simpan & Posting"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Task List Grid */}
      <div className="space-y-3">
        {tugasList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-805 p-6 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-655" />
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Belum Ada Tugas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isAdmin ? "Silakan klik 'Tambah Tugas' untuk mempublikasikan instruksi pertama." : "Silakan tunggu Ketua Kelas mempublikasikan instruksi tugas baru."}
              </p>
            </div>
          </div>
        ) : (
          tugasList.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setActiveTask(task);
                setCommentText("");
              }}
              className="group relative bg-white dark:bg-slate-900 block rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-xs transition-all duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1 max-w-[85%]">
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-450 transition-colors">
                    {task.judul}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {task.deskripsi}
                  </p>
                </div>

                {/* Trash Button for Admin */}
                {isAdmin && (
                  <button
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="p-2 text-slate-400 dark:text-slate-550 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all duration-200 self-start cursor-pointer"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>

              {/* Badges bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800/60 text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500" />
                  {formatDate(task.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500" />
                  {task.komentar?.length || 0} Komentar
                </span>
                {task.fileUrl && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-305 text-[10px] font-sans font-semibold">
                    Lampiran {task.fileType?.includes("pdf") ? "PDF" : "Foto"}
                  </span>
                )}
                <span className="text-indigo-500 dark:text-indigo-400 font-semibold flex items-center gap-0.5 ml-auto group-hover:translate-x-0.5 transition-transform font-sans">
                  Detail Forum
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Details and Comments Modal Screen (Sheet) */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setActiveTask(null)}
          />

          {/* Right Panel Card Container */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-150 dark:border-slate-800 h-screen flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 transition-colors duration-300">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-850/50">
              <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-widest font-mono">
                FORUM DETAIL TUGAS
              </span>
              <button
                id="task-detail-close-btn"
                onClick={() => setActiveTask(null)}
                className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Main Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Task Core Content */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                  Diposting pada {formatDate(activeTask.createdAt)}
                </span>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-50 leading-snug">
                  {activeTask.judul}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {activeTask.deskripsi}
                </p>

                {/* Attachment if any */}
                {activeTask.fileUrl && activeTask.fileName && activeTask.fileType && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Lampiran File:
                    </span>
                    <FileViewer 
                      fileUrl={activeTask.fileUrl} 
                      fileName={activeTask.fileName} 
                      fileType={activeTask.fileType} 
                    />
                  </div>
                )}
              </div>

              {/* Comment Thread List */}
              <div className="pt-6 border-t border-slate-100/80 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  Diskusi Komentar ({activeTask.komentar?.length || 0})
                </h3>

                <div className="space-y-3">
                  {(!activeTask.komentar || activeTask.komentar.length === 0) ? (
                    <p className="text-xs text-center py-6 text-slate-400 dark:text-slate-500 italic">
                      Belum ada komentar di tugas ini. Jadilah yang pertama berkomentar!
                    </p>
                  ) : (
                    activeTask.komentar.map((comment) => (
                      <div 
                        key={comment.id}
                        className="group/comment relative p-3.5 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1 max-w-[85%]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {comment.nama}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {comment.teks}
                            </p>
                          </div>

                          {/* Delete Comment Button (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(activeTask.id, comment.id)}
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

            {/* Static Bottom Comment Input Panel */}
            <div className="border-t border-slate-150 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shrink-0 shadow-lg">
              <form onSubmit={(e) => handlePostComment(e, activeTask.id)} className="space-y-2.5">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <input
                    id="comment-name-input"
                    type="text"
                    placeholder="Nama Anda (Kosong = Anonim)"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full text-xs font-medium text-slate-750 dark:text-slate-200 bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans shadow-2xs"
                    maxLength={30}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    id="comment-text-input"
                    required
                    rows={2}
                    placeholder="Tulis tanggapan / komentar Anda..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans resize-none"
                    maxLength={1000}
                  />
                  <button
                    id="comment-submit-btn"
                    type="submit"
                    disabled={isCommenting || !commentText.trim()}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
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
