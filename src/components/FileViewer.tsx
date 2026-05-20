import { useState } from "react";
import { FileText, Download, Eye, Image as ImageIcon } from "lucide-react";

interface FileViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

export default function FileViewer({ fileUrl, fileName, fileType }: FileViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isImage = fileType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const isPdf = fileType === "application/pdf" || /\.pdf$/i.test(fileName);

  if (isImage) {
    return (
      <div className="mt-3">
        {/* Thumbnail preview */}
        <div 
          onClick={() => setIsOpen(true)}
          className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 aspect-video max-h-48 cursor-pointer shadow-xs hover:border-indigo-200 transition-all duration-200"
        >
          <img 
            src={fileUrl} 
            alt={fileName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 text-slate-800 rounded-full text-xs font-semibold shadow-md">
              <Eye className="w-3.5 h-3.5" />
              Perbesar Foto
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-404 dark:text-slate-500 mt-1 font-mono truncate px-1 flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-slate-305 dark:text-slate-500" />
          {fileName}
        </p>

        {/* Lightbox Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <img 
                src={fileUrl} 
                alt={fileName}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
              <div className="mt-3 flex items-center justify-between px-3 pb-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[70%]">
                  {fileName}
                </span>
                <div className="flex gap-2">
                  <a
                    href={fileUrl}
                    download={fileName}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh
                  </a>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-lg transition-colors cursor-pointer animate-none"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PDF display
  return (
    <div className="mt-3 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3 shadow-xs hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-all duration-200">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0 border border-red-100 dark:border-red-900/35">
          <FileText className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-slate-705 dark:text-slate-200 truncate block">
            {fileName}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase">
            PDF Dokumen
          </span>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-403 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
          title="Buka PDF"
        >
          <Eye className="w-4 h-4" />
        </a>
        <a
          href={fileUrl}
          download={fileName}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-403 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
          title="Unduh PDF"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
