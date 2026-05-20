import { useState, useEffect } from "react";
import { ForumDB, Tugas, Jawaban } from "./types";
import TaskTab from "./components/TaskTab";
import AnswerTab from "./components/AnswerTab";
import AdminLoginModal from "./components/AdminLoginModal";
import { 
  BookOpen, 
  Share2, 
  Search, 
  LogIn, 
  LogOut, 
  Loader2, 
  UserCheck, 
  Users,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"tugas" | "jawaban">("tugas");
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [jawabanList, setJawabanList] = useState<Jawaban[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
  
  // Admin auth states
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial lists & tokens
  const fetchForumData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const response = await fetch("/api/forum");
      if (response.ok) {
        const data: ForumDB = await response.json();
        setTugasList(data.tugas || []);
        setJawabanList(data.jawaban || []);
      }
    } catch (err) {
      console.error("Failed to connect to backend", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check localStorage for admin authorization status
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAdmin(true);
    }

    // Call immediate data load
    fetchForumData();

    // Set up Real-Time background sync loop every 3 seconds
    const interval = setInterval(() => {
      fetchForumData(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem("admin_token", token);
    setAdminToken(token);
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken(null);
    setIsAdmin(false);
  };

  // Filter systems
  const filteredTugas = tugasList.filter(
    (item) =>
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJawaban = jawabanList.filter(
    (item) =>
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaPengirim.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-3 font-mono">
          Menghubungkan Portal Kelas TIB...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col antialiased transition-colors duration-300">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-150/90 dark:border-slate-800/80 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-indigo-600/20">
              TB
            </div>
            <div>
              <h1 className="text-[18px] font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 leading-none">
                KELAS TIB
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider">
                  Forum Diskusi
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Portal Informasi & Jawaban Tugas Rekan Mahasiswa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggler"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center"
              title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-[spin_8s_linear_infinite]" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Connection sync status bar */}
            <div 
              onClick={() => fetchForumData()}
              className="p-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-250/20 dark:hover:bg-slate-700/50 flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none transition-all"
              title="Real-time terhubung (klik untuk force refresh)"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">Real-time</span>
            </div>

            {/* Auth Button */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-indigo-50/80 dark:bg-indigo-950/40 p-1.5 pr-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide hidden sm:inline">
                  Admin
                </span>
                <button
                  id="admin-logout-btn"
                  onClick={handleLogout}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="admin-login-modal-btn"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:text-indigo-300 hover:dark:text-white text-xs font-bold rounded-xl border border-indigo-100/60 dark:border-indigo-900/50 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Ketua</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with Responsive Bento Grid Arrangement */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-4 pb-24">
        
        {/* Bento Grid Header Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Bento Card 1: Information Banner */}
          <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase block">
                Ruang Komunitas TIB
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                Portal Mandiri Pembelajaran Mahasiswa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Membantu kelancaran belajar & transparansi tugas kuliah. Saling mengunggah materi kerjaan, menanyakan solusi, dan menuliskan komentar diskusi sehat secara aman bersama rekan sekelas.
              </p>
            </div>
            
            {/* Quick Informational footer for student support */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              <span>Sistem Mandiri Aktif</span>
              <span>Reset Otomatis: 1 Jan</span>
            </div>
          </div>

          {" "}
          {/* Bento Card 2: Academic Statistics Block */}
          <div className="md:col-span-4 bg-indigo-950 dark:bg-indigo-950/80 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute right-[-15px] bottom-[-15px] w-24 h-24 bg-indigo-800/20 rounded-full blur-xl" />
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-300 tracking-widest uppercase block">
                Tahun Akademik
              </span>
              <p className="text-xl font-extrabold font-mono tracking-tight">2026/2027</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-indigo-900">
              <div className="space-y-0.5">
                <span className="text-[9px] text-indigo-300 uppercase block font-medium">FORUM TUGAS</span>
                <span className="text-lg font-bold font-mono tracking-tight">{tugasList.length} Tugas</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-indigo-300 uppercase block font-medium">FORUM JAWABAN</span>
                <span className="text-lg font-bold font-mono tracking-tight">{jawabanList.length} Solusi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Tabs Bento Action Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Search Box in modern rounded block config */}
          <div className="md:col-span-5 relative flex items-center">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="global-search-input"
              type="text"
              placeholder={
                activeTab === "tugas"
                  ? "Cari instruksi, judul tugas, dokumen..."
                  : "Cari postingan jawaban kuliah..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-16 py-3.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] font-bold font-mono cursor-pointer"
              >
                BERSIHKAN
              </button>
            )}
          </div>

          {/* Sticky Tabs Toggle Bar with Bento aesthetics */}
          <div className="md:col-span-7 p-1 bg-slate-100 dark:bg-slate-905 bg-slate-150/40 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-1 shadow-2xs">
            <button
              id="tab-btn-tugas"
              onClick={() => {
                setActiveTab("tugas");
                setSearchQuery("");
              }}
              className={`flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "tugas"
                  ? "bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Bilah Forum Tugas
            </button>
            <button
              id="tab-btn-jawaban"
              onClick={() => {
                setActiveTab("jawaban");
                setSearchQuery("");
              }}
              className={`flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "jawaban"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Share2 className="w-4 h-4" />
              Bilah Forum Jawaban
            </button>
          </div>

        </div>

        {/* Tab Content Display Area inside modern container */}
        <div className="pt-1 select-none">
          {activeTab === "tugas" ? (
            <TaskTab
              tugasList={filteredTugas}
              isAdmin={isAdmin}
              adminToken={adminToken}
              onRefresh={fetchForumData}
            />
          ) : (
            <AnswerTab
              jawabanList={filteredJawaban}
              isAdmin={isAdmin}
              adminToken={adminToken}
              onRefresh={fetchForumData}
            />
          )}
        </div>
      </main>

      {/* Modern footer with bento accent structure */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center space-y-2">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 font-sans tracking-wide">
            &copy; {new Date().getFullYear()} KELAS TIB FORUM
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-sm mx-auto font-medium">
            Dikembangkan secara berkala untuk mendukung kapasitas kolaborasi belajar mahasiswa. Respon data real-time, moderasi, serta pembersihan memori tahunan aktif.
          </p>
        </div>
      </footer>

      {/* Modals & Dialog Portals */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
