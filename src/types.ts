export interface Komentar {
  id: string;
  nama: string;
  teks: string;
  createdAt: string;
}

export interface Tugas {
  id: string;
  judul: string;
  deskripsi: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null; // 'image' or 'pdf' or others
  createdAt: string;
  komentar: Komentar[];
}

export interface Jawaban {
  id: string;
  judul: string;
  deskripsi: string;
  namaPengirim: string;
  fileUrl: string; // Wajib
  fileName: string;
  fileType: string;
  createdAt: string;
  komentar: Komentar[];
}

export interface ForumDB {
  tugas: Tugas[];
  jawaban: Jawaban[];
  lastYear: number;
}
