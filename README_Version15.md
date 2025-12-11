```markdown
# Kalkulator Permutasi & Kombinasi — Deployment & ZIP

Instruksi singkat untuk mengganti file, membuat paket ZIP, dan menjalankan secara lokal.

File utama:
- index.html
- styles.css
- script.js

1) Copy / replace
   - Ganti file di folder proyek Anda dengan isi index.html, styles.css, script.js yang sudah saya kirim.

2) Jalankan lokal (opsi cepat)
   - Buka terminal di folder proyek lalu jalankan server statis sederhana:
     - Python 3:
       python -m http.server 8000
       lalu buka http://localhost:8000/index.html
     - Node (http-server):
       npx http-server -p 8000

3) Buat paket ZIP (Linux / macOS / Windows WSL)
   - Pastikan berada di folder yang berisi index.html, styles.css, script.js
   - Jalankan:
     zip kalkulator-kombinasi.zip index.html styles.css script.js
   - File kalkulator-kombinasi.zip akan siap untuk diunggah atau dibagikan.

4) Deployment singkat
   - Upload file ke hosting statis (Netlify, Vercel, GitHub Pages)
   - Untuk GitHub Pages: buat repo, push file ke branch `gh-pages` atau `main` dan aktifkan Pages di Settings.

5) Testing
   - Buka halaman, klik "Uji cepat" atau masukkan soal seperti:
     - "Banyak susunan kata yang dapat dibentuk dari kata DINAYA adalah…"
   - Klik "Analisis Soal" lalu periksa panel Analisis.
   - Jika deteksi bagus, klik "Analisis & Hitung" atau "Hitung".

6) Menyesuaikan pola deteksi
   - Jika Anda memiliki variasi soal lain, kirim 3-5 contoh.
   - Saya akan menambahkan pola regex yang menargetkan frasa tersebut (mis. "anagram", "susunan huruf", "huruf ...", "arrange the letters", dsb.)

Catatan:
- Heuristik berbasis regex tidak sempurna; untuk cakupan luas, pertimbangkan classifier/NER (model NLP).
- Selalu periksa panel analisis ketika confidence rendah sebelum menerapkan otomatis.
```