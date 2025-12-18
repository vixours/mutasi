// Tab Navigation
function openTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.target.classList.add('active');
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function () {
    // Setup event listeners untuk mode radio
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const multinomialControls = document.getElementById('multinomial-controls');

    modeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value === 'multinomial') {
                multinomialControls.classList.remove('hidden');
            } else {
                multinomialControls.classList.add('hidden');
            }
        });
    });

    // Setup event listeners untuk uji cepat
    const soalBtns = document.querySelectorAll('.soal-btn');
    soalBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const n = this.getAttribute('data-n');
            const r = this.getAttribute('data-r');
            const mode = this.getAttribute('data-mode');
            const multi = this.getAttribute('data-multi');

            // Update input values
            document.getElementById('input-n').value = n;
            document.getElementById('input-r').value = r;

            // Update radio button
            document.querySelectorAll('input[name="mode"]').forEach(radio => {
                radio.checked = radio.value === mode;
            });

            // Update multinomial controls and value
            if (mode === 'multinomial') {
                multinomialControls.classList.remove('hidden');
                if (multi) {
                    document.getElementById('multinomial-counts').value = multi;
                }
            } else {
                multinomialControls.classList.add('hidden');
            }

            // Update elements list based on soal
            updateElementsList(n, this.textContent);

            // Update soal input
            document.getElementById('user-soal').value = this.textContent;

            // Remove active class from all buttons
            soalBtns.forEach(b => {
                b.style.background = 'white';
                b.style.color = 'var(--text)';
                b.style.borderColor = 'var(--border)';
            });
            // Add active style to clicked button
            this.style.background = 'linear-gradient(135deg, var(--soft-blue), var(--soft-purple))';
            this.style.color = 'white';
            this.style.borderColor = 'transparent';

            // Hitung otomatis
            calculateWithAnalisis();
        });
    });

    // Setup event listeners untuk tombol analisis
    document.getElementById('btn-analyze').addEventListener('click', analyzeAndCalculate);

    // Setup event listeners untuk tombol hitung dan clear
    document.getElementById('btn-calc').addEventListener('click', calculateWithAnalisis);
    document.getElementById('btn-clear').addEventListener('click', clearCalculator);

    // Show placeholder initially
    showResultPlaceholder();

    // ====== KODE BARU UNTUK ANALISIS YANG LEBIH BAIK ======
    
    // Tambahkan contoh soal yang lebih variatif
    const soalTextarea = document.getElementById('user-soal');
    soalTextarea.addEventListener('focus', function() {
        if (!this.value.trim()) {
            this.placeholder = "Contoh:\n1. Dari 8 siswa, pilih 3 orang untuk menjadi pengurus?\n2. Ada 5 huruf A, B, C, D, E. Berapa banyak susunan 3 huruf?\n3. 4 orang duduk melingkar, berapa cara?\n4. 5 bola dengan 2 merah, 2 biru, 1 hijau, berapa cara menyusun?\n5. P(6,3) atau C(10,4)\n6. 6 angka dibuat password 3 digit\n7. 2,2,1 distribusi multinomial";
        }
    });

    // Update contoh tombol uji cepat dengan variasi lebih banyak
    const soalBtnsUpdated = document.querySelectorAll('.soal-btn');
    const soalExamples = [
        { text: "Dari 8 siswa pilih 3 pengurus", n: 8, r: 3, mode: "nCr" },
        { text: "6 huruf susun 4 huruf", n: 6, r: 4, mode: "nPr" },
        { text: "4 orang duduk melingkar", n: 4, r: 0, mode: "circular" },
        { text: "Password 3 digit dari 5 angka", n: 5, r: 3, mode: "repetition_permutation" },
        { text: "5 bola: 2M,2B,1H (multinomial)", n: 5, r: 0, mode: "multinomial", multi: "2,2,1" },
        { text: "10 item ambil 4 item", n: 10, r: 4, mode: "nCr" },
        { text: "P(7,3) permutasi", n: 7, r: 3, mode: "nPr" },
        { text: "C(9,2) kombinasi", n: 9, r: 2, mode: "nCr" }
    ];

    // Update tombol dengan contoh yang lebih baik
    soalBtnsUpdated.forEach((btn, index) => {
        if (index < soalExamples.length) {
            const example = soalExamples[index];
            btn.textContent = example.text;
            btn.setAttribute('data-n', example.n);
            btn.setAttribute('data-r', example.r);
            btn.setAttribute('data-mode', example.mode);
            if (example.multi) {
                btn.setAttribute('data-multi', example.multi);
            } else {
                btn.removeAttribute('data-multi');
            }
        }
    });
});

// ====== FUNGSI ANALISIS YANG DIPERBAIKI LEBIH AKURAT ======

// Fungsi untuk analisis soal - DIPERBAIKI LEBIH AKURAT
function analyzeProblem(soalText) {
    const result = {
        n: null,
        r: null,
        mode: null,
        multiCounts: null,
        keywords: [],
        detectedPattern: null,
        confidence: 0
    };

    // Normalisasi teks soal
    const cleanText = soalText.toLowerCase().replace(/\s+/g, ' ').trim();
    result.cleanText = cleanText;

    console.log('🔍 Analisis soal:', soalText);
    console.log('📝 Teks bersih:', cleanText);

    // 1. EKSTRAKSI ANGKA dengan konteks yang lebih baik
    const angkaPatterns = [
        // Pola "dari X, pilih Y" atau "X siswa, pilih Y"
        /dari\s+(\d+)\s*(?:siswa|orang|mahasiswa|anggota|item|bola|huruf|angka)?(?:\s*,\s*|\s+)pilih\s+(\d+)/gi,
        /(\d+)\s*(?:siswa|orang|mahasiswa|anggota|item|bola|huruf|angka)(?:\s*,\s*|\s+)pilih\s+(\d+)/gi,
        /(\d+)\s*(?:siswa|orang|mahasiswa|anggota|item|bola|huruf|angka)\s+diambil\s+(\d+)/gi,
        /(\d+)\s*(?:siswa|orang|mahasiswa|anggota|item|bola|huruf|angka)\s+dipilih\s+(\d+)/gi,
        
        // Pola "ambil X dari Y"
        /ambil\s+(\d+)\s+dari\s+(\d+)/gi,
        /pilih\s+(\d+)\s+dari\s+(\d+)/gi,
        /pilih\s+(\d+)\s+orang\s+dari\s+(\d+)/gi,
        
        // Pola standar angka
        /(\d+)\s+dan\s+(\d+)/gi,
        /angka\s+(\d+)\s+dan\s+(\d+)/gi
    ];

    let angkaTerdeteksi = false;
    for (let pattern of angkaPatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1] && match[2]) {
            // Untuk pola "pilih X dari Y", urutannya terbalik: X = r, Y = n
            if (pattern.toString().includes('pilih') || pattern.toString().includes('ambil')) {
                result.r = parseInt(match[1]);
                result.n = parseInt(match[2]);
            } else {
                result.n = parseInt(match[1]);
                result.r = parseInt(match[2]);
            }
            angkaTerdeteksi = true;
            console.log(`✅ Angka terdeteksi: n=${result.n}, r=${result.r}`);
            break;
        }
    }

    // Jika belum terdeteksi pola kontekstual, cari semua angka
    if (!angkaTerdeteksi) {
        const semuaAngka = cleanText.match(/\d+/g);
        if (semuaAngka) {
            const nums = semuaAngka.map(Number);
            console.log('🔢 Semua angka ditemukan:', nums);
            
            // Logika pemilihan angka yang lebih cerdas
            if (nums.length === 1) {
                result.n = nums[0];
                // Coba tebak r dari konteks
                if (cleanText.includes('pilih 2') || cleanText.includes('ambil 2') || cleanText.includes('dua')) {
                    result.r = 2;
                } else if (cleanText.includes('pilih 3') || cleanText.includes('ambil 3') || cleanText.includes('tiga')) {
                    result.r = 3;
                } else if (cleanText.includes('pilih 4') || cleanText.includes('ambil 4') || cleanText.includes('empat')) {
                    result.r = 4;
                }
            } else if (nums.length >= 2) {
                // Ambil 2 angka terbesar sebagai kandidat
                const sortedNums = [...nums].sort((a, b) => b - a);
                result.n = sortedNums[0]; // Angka terbesar = n
                result.r = sortedNums[1]; // Angka kedua = r
                
                // Kecuali jika ada petunjuk lain
                if (cleanText.includes('huruf') || cleanText.includes('angka')) {
                    // Untuk huruf/angka, biasanya n > r
                    result.n = Math.max(nums[0], nums[1]);
                    result.r = Math.min(nums[0], nums[1]);
                }
            }
        }
    }

    // 2. DETEKSI MODE DENGAN PRIORITAS TINGGI (pola matematika eksplisit)
    const mathPatterns = [
        // Pola P(n,r) atau C(n,r) - PRIORITAS TERTINGGI
        { pattern: /p\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, mode: 'nPr', confidence: 100 },
        { pattern: /c\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, mode: 'nCr', confidence: 100 },
        { pattern: /permutasi\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, mode: 'nPr', confidence: 100 },
        { pattern: /kombinasi\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, mode: 'nCr', confidence: 100 },
        
        // Pola nPr atau nCr
        { pattern: /(\d+)\s*p\s*(\d+)/gi, mode: 'nPr', confidence: 90 },
        { pattern: /(\d+)\s*c\s*(\d+)/gi, mode: 'nCr', confidence: 90 },
        
        // Pola pangkat (permutasi dengan pengulangan)
        { pattern: /(\d+)\s*\^\s*(\d+)/gi, mode: 'repetition_permutation', confidence: 95 },
        
        // Pola faktorial eksplisit
        { pattern: /(\d+)\s*!\s*\/\s*(\d+)\s*!/gi, mode: 'nPr', confidence: 85 },
        { pattern: /(\d+)\s*!\s*\/\s*\(\s*(\d+)\s*!\s*\*\s*(\d+)\s*!\s*\)/gi, mode: 'nCr', confidence: 85 },
    ];

    for (let mathPattern of mathPatterns) {
        const match = cleanText.match(mathPattern.pattern);
        if (match) {
            result.mode = mathPattern.mode;
            result.confidence = mathPattern.confidence;
            result.detectedPattern = mathPattern.pattern.toString();
            
            // Update angka jika ditemukan dalam pola
            if (match[1] && match[2]) {
                result.n = parseInt(match[1]);
                result.r = parseInt(match[2]);
            }
            
            console.log(`🎯 Pola matematika terdeteksi: ${result.mode} (confidence: ${result.confidence})`);
            break;
        }
    }

    // 3. DETEKSI BERDASARKAN KATA KUNCI (jika belum ada mode dari pola matematika)
    if (!result.mode) {
        console.log('🔤 Analisis berdasarkan kata kunci...');
        
        // PERMUTASI SIRKULAR (prioritas tinggi karena unik)
        if (cleanText.includes('lingkar') || cleanText.includes('bundar') || 
            cleanText.includes('sirkular') || cleanText.includes('melingkar') ||
            cleanText.includes('meja bundar') || cleanText.includes('duduk melingkar') ||
            cleanText.includes('kursi melingkar') || cleanText.includes('melingkari')) {
            result.mode = 'circular';
            result.confidence = 90;
            result.keywords.push('sirkular');
            // Untuk sirkular, r tidak digunakan
            result.r = null;
            console.log('🌀 Mode: Permutasi Sirkular');
        }
        // MULTINOMIAL
        else if (cleanText.includes('multinomial') || 
                 (cleanText.includes('bagi') && cleanText.includes('kelompok')) ||
                 (cleanText.includes('warna') && cleanText.includes('jenis')) ||
                 /\d+[,\s]+\d+[,\s]+\d+/.test(cleanText)) {
            result.mode = 'multinomial';
            result.confidence = 85;
            result.keywords.push('multinomial');
            
            // Cari pola 2,2,1 atau 3,1,1
            const multiMatch = cleanText.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
            if (multiMatch) {
                result.multiCounts = [
                    parseInt(multiMatch[1]),
                    parseInt(multiMatch[2]),
                    parseInt(multiMatch[3])
                ];
                result.n = result.multiCounts.reduce((a, b) => a + b, 0);
                result.r = null;
            }
            console.log('🎨 Mode: Multinomial');
        }
        // PERMUTASI DENGAN PENGULANGAN
        else if ((cleanText.includes('ulang') || cleanText.includes('repeat') || cleanText.includes('boleh')) && 
                 (cleanText.includes('digit') || cleanText.includes('angka') || 
                  cleanText.includes('password') || cleanText.includes('kata sandi') ||
                  cleanText.includes('kode') || cleanText.includes('pin'))) {
            result.mode = 'repetition_permutation';
            result.confidence = 80;
            result.keywords.push('pengulangan', 'permutasi');
            console.log('🔁 Mode: Permutasi dengan Pengulangan');
        }
        // KOMBINASI DENGAN PENGULANGAN
        else if ((cleanText.includes('ulang') || cleanText.includes('repeat') || cleanText.includes('boleh')) && 
                 (cleanText.includes('permen') || cleanText.includes('buah') || 
                  cleanText.includes('makanan') || cleanText.includes('jenis'))) {
            result.mode = 'repetition_combination';
            result.confidence = 80;
            result.keywords.push('pengulangan', 'kombinasi');
            console.log('🔄 Mode: Kombinasi dengan Pengulangan');
        }
        // PERMUTASI BIASA - DETEKSI LEBIH SPESIFIK
        else if ((cleanText.includes('permutasi') && !cleanText.includes('kombinasi')) ||
                 cleanText.includes('susun') || cleanText.includes('urutan') ||
                 cleanText.includes('penyusunan') || cleanText.includes('susunan') ||
                 (cleanText.includes('cara') && (cleanText.includes('menyusun') || cleanText.includes('mengatur'))) ||
                 (cleanText.includes('banyak') && (cleanText.includes('susunan') || cleanText.includes('urutan'))) ||
                 // Konteks jabatan/peran
                 (cleanText.includes('ketua') && cleanText.includes('wakil')) ||
                 (cleanText.includes('presiden') && cleanText.includes('wakil')) ||
                 (cleanText.includes('sekretaris') && cleanText.includes('bendahara')) ||
                 (cleanText.includes('jabatan') && cleanText.includes('posisi')) ||
                 // Konteks pemenang
                 (cleanText.includes('juara') && (cleanText.includes('pertama') || cleanText.includes('kedua'))) ||
                 (cleanText.includes('pemenang') && cleanText.includes('hadiah'))) {
            result.mode = 'nPr';
            result.confidence = 75;
            result.keywords.push('permutasi');
            console.log('🔢 Mode: Permutasi (nPr)');
        }
        // KOMBINASI BIASA - DETEKSI LEBIH SPESIFIK
        else if ((cleanText.includes('kombinasi') && !cleanText.includes('permutasi')) ||
                 (cleanText.includes('pilih') && !cleanText.includes('susun')) ||
                 cleanText.includes('tim') || cleanText.includes('komite') ||
                 cleanText.includes('panitia') || cleanText.includes('kelompok') ||
                 cleanText.includes('komisi') || cleanText.includes('delegasi') ||
                 (cleanText.includes('banyak') && cleanText.includes('cara memilih')) ||
                 (cleanText.includes('berapa') && cleanText.includes('cara memilih')) ||
                 // Konteks memilih tanpa jabatan
                 (cleanText.includes('memilih') && !cleanText.includes('ketua') && 
                  !cleanText.includes('wakil') && !cleanText.includes('sekretaris')) ||
                 // Konteks mengambil benda
                 (cleanText.includes('ambil') && !cleanText.includes('susun')) ||
                 (cleanText.includes('mengambil') && (cleanText.includes('bola') || 
                  cleanText.includes('kelereng') || cleanText.includes('buah')))) {
            result.mode = 'nCr';
            result.confidence = 75;
            result.keywords.push('kombinasi');
            console.log('👥 Mode: Kombinasi (nCr)');
        }
    }

    // 4. LOGIKA FALLBACK DAN VALIDASI AKHIR
    if (!result.mode && result.n && result.r) {
        // Jika ada n dan r tapi mode tidak terdeteksi
        if (cleanText.includes('susun') || cleanText.includes('urut')) {
            result.mode = 'nPr';
            result.confidence = 60;
            console.log('⚡ Fallback: Default ke permutasi (ada kata "susun/urut")');
        } else if (cleanText.includes('pilih') || cleanText.includes('ambil')) {
            result.mode = 'nCr';
            result.confidence = 60;
            console.log('⚡ Fallback: Default ke kombinasi (ada kata "pilih/ambil")');
        } else {
            // Default: jika r <= n → permutasi, jika r > n → kombinasi
            if (result.r <= result.n) {
                result.mode = 'nPr';
                result.confidence = 50;
                console.log('⚡ Fallback: Default ke permutasi (r <= n)');
            } else {
                result.mode = 'nCr';
                result.confidence = 50;
                console.log('⚡ Fallback: Default ke kombinasi (r > n)');
            }
        }
    }

    // 5. KOREKSI TERBALIK n dan r
    // Jika n < r untuk permutasi/kombinasi biasa, mungkin terbalik
    if ((result.mode === 'nPr' || result.mode === 'nCr') && result.n && result.r) {
        if (result.n < result.r) {
            console.warn('⚠️ n < r, mungkin terbalik. Menukar n dan r...');
            const temp = result.n;
            result.n = result.r;
            result.r = temp;
        }
    }

    // 6. VALIDASI AKHIR
    if (result.mode === 'circular') {
        result.r = null; // Sirkular tidak menggunakan r
    }
    
    if (result.mode === 'multinomial' && result.multiCounts && !result.n) {
        result.n = result.multiCounts.reduce((a, b) => a + b, 0);
        result.r = null;
    }
    
    // Pastikan r ada untuk permutasi/kombinasi
    if ((result.mode === 'nPr' || result.mode === 'nCr') && !result.r && result.n) {
        // Tebak r dari konteks
        if (cleanText.includes('2')) result.r = 2;
        else if (cleanText.includes('3')) result.r = 3;
        else if (cleanText.includes('4')) result.r = 4;
        else if (cleanText.includes('5')) result.r = 5;
        else result.r = Math.min(3, result.n); // Default 3 atau n jika n < 3
    }

    console.log('📊 Hasil analisis akhir:', {
        n: result.n,
        r: result.r,
        mode: result.mode,
        confidence: result.confidence,
        keywords: result.keywords
    });
    
    return result;
}

// Fungsi untuk menampilkan detail analisis
function showAnalisisDetails(analisis) {
    const details = `
        <div class="analisis-details" style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
            <h5 style="margin-top: 0; color: #3b82f6;">🔍 Detail Analisis:</h5>
            <ul style="margin-bottom: 0; padding-left: 20px;">
                <li><strong>n (jumlah elemen):</strong> ${analisis.n || 'Tidak terdeteksi'}</li>
                <li><strong>r (elemen terpilih):</strong> ${analisis.r !== null ? analisis.r : 'Tidak digunakan'}</li>
                <li><strong>Mode:</strong> ${analisis.mode || 'Tidak terdeteksi'}</li>
                <li><strong>Tingkat Kepercayaan:</strong> ${analisis.confidence || 0}%</li>
                <li><strong>Kata kunci terdeteksi:</strong> ${analisis.keywords.length > 0 ? analisis.keywords.join(', ') : 'Tidak terdeteksi'}</li>
                ${analisis.detectedPattern ? `<li><strong>Pola terdeteksi:</strong> ${analisis.detectedPattern}</li>` : ''}
                ${analisis.multiCounts ? `<li><strong>Kategori Multinomial:</strong> ${analisis.multiCounts.join(', ')}</li>` : ''}
            </ul>
        </div>
    `;
    
    // Tambahkan ke analisis section
    const analisisContent = document.getElementById('analisis-content');
    if (analisisContent) {
        const existingDetails = analisisContent.querySelector('.analisis-details');
        if (existingDetails) {
            existingDetails.remove();
        }
        analisisContent.innerHTML = details + analisisContent.innerHTML;
    }
}

// Fungsi untuk analisis soal dan hitung
function analyzeAndCalculate() {
    const soalText = document.getElementById('user-soal').value.trim();

    if (!soalText) {
        alert('Silakan masukkan soal terlebih dahulu!');
        return;
    }

    console.log('🚀 Memulai analisis soal...');
    console.log('Soal input:', soalText);

    // Analisis soal
    const analisis = analyzeProblem(soalText);

    // Update input values
    if (analisis.n !== null) {
        document.getElementById('input-n').value = analisis.n;
        console.log(`✅ n diatur ke: ${analisis.n}`);
    }

    if (analisis.r !== null) {
        document.getElementById('input-r').value = analisis.r;
        console.log(`✅ r diatur ke: ${analisis.r}`);
    }

    // Update mode
    let modeUpdated = false;
    if (analisis.mode) {
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            if (radio.value === analisis.mode) {
                radio.checked = true;
                modeUpdated = true;
                console.log(`✅ Mode diatur ke: ${analisis.mode} (confidence: ${analisis.confidence}%)`);
                
                if (analisis.mode === 'multinomial') {
                    document.getElementById('multinomial-controls').classList.remove('hidden');
                    if (analisis.multiCounts) {
                        document.getElementById('multinomial-counts').value = analisis.multiCounts.join(',');
                        console.log(`✅ Kategori multinomial: ${analisis.multiCounts.join(',')}`);
                    }
                } else {
                    document.getElementById('multinomial-controls').classList.add('hidden');
                }
            }
        });
    }

    // Feedback ke user
    if (!modeUpdated) {
        const msg = 'Mode tidak terdeteksi secara otomatis. Silakan pilih mode secara manual.';
        console.warn('⚠️ ' + msg);
        alert(msg + '\n\nTips: Gunakan format yang jelas seperti "Dari 8 siswa, pilih 3 orang" atau "P(5,3)".');
    } else if (analisis.confidence < 70) {
        console.warn(`⚠️ Confidence rendah: ${analisis.confidence}%. Periksa hasil analisis.`);
    }

    // Update elements list
    updateElementsList(analisis.n || 0, soalText);

    // Reset highlight tombol
    document.querySelectorAll('.soal-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = 'var(--text)';
        btn.style.borderColor = 'var(--border)';
    });

    // Hitung
    calculateWithAnalisis(analisis);
    
    // Tampilkan detail
    showAnalisisDetails(analisis);
}

// ====== FUNGSI LAIN YANG TETAP SAMA ======

// Fungsi untuk menampilkan placeholder hasil
function showResultPlaceholder() {
    document.getElementById('result-display').classList.remove('hidden');
    document.getElementById('result-number').textContent = '0';
    document.getElementById('result-type').textContent = 'Masukkan nilai lalu klik "Hitung Sekarang"';
    document.getElementById('result-mode-label').textContent = 'Mode: -';
    document.getElementById('formula-display').textContent = 'Formula akan muncul setelah perhitungan';
    document.getElementById('analisis-section').classList.add('hidden');
    document.getElementById('result-list').classList.add('hidden');
}

// Fungsi untuk update daftar elemen berdasarkan soal
function updateElementsList(n, soalText) {
    const elementsTextarea = document.getElementById('elements-list');

    if (soalText.includes('siswa') || soalText.includes('orang') || soalText.includes('pengurus')) {
        const siswaNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indra', 'Joko'];
        const elements = siswaNames.slice(0, n);
        elementsTextarea.value = elements.join(', ');
    } else if (soalText.includes('huruf') || soalText.includes('kata')) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const elements = letters.slice(0, n);
        elementsTextarea.value = elements.join(', ');
    } else if (soalText.includes('item')) {
        const items = ['Item1', 'Item2', 'Item3', 'Item4', 'Item5', 'Item6', 'Item7', 'Item8', 'Item9', 'Item10'];
        const elements = items.slice(0, n);
        elementsTextarea.value = elements.join(', ');
    } else if (soalText.includes('angka') || soalText.includes('digit')) {
        const numbers = Array.from({ length: n }, (_, i) => i + 1);
        elementsTextarea.value = numbers.join(', ');
    } else if (soalText.includes('bola') || soalText.includes('warna')) {
        const colors = ['Merah', 'Biru', 'Hijau', 'Kuning', 'Ungu', 'Oranye', 'Pink', 'Coklat', 'Putih', 'Hitam'];
        const elements = colors.slice(0, n);
        elementsTextarea.value = elements.join(', ');
    } else {
        // Default: angka
        const numbers = Array.from({ length: n }, (_, i) => i + 1);
        const elements = numbers.map(num => `Elemen ${num}`);
        elementsTextarea.value = elements.join(', ');
    }
}

// Fungsi untuk menghitung dengan analisis
function calculateWithAnalisis(analisisData = null) {
    const n = parseInt(document.getElementById('input-n').value) || 0;
    const r = parseInt(document.getElementById('input-r').value) || 0;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const showList = document.getElementById('list-results').checked;

    // Validasi input
    if (n === 0 && r === 0 && mode !== 'circular') {
        document.getElementById('result-number').textContent = '0';
        document.getElementById('result-type').textContent = 'Masukkan nilai n dan r terlebih dahulu';
        document.getElementById('formula-display').textContent = 'Silakan masukkan nilai untuk menghitung';
        document.getElementById('analisis-section').classList.add('hidden');
        document.getElementById('result-display').classList.remove('hidden');
        return;
    }

    // Hitung berdasarkan mode
    let result = 0;
    let formula = '';
    let steps = [];
    let modeName = '';

    switch (mode) {
        case 'nPr':
            if (r > n && n > 0) {
                result = 0;
                modeName = `Permutasi (${n}P${r})`;
                formula = `P(${n},${r}) = Tidak valid (r > n)`;
                steps = [
                    '❌ <strong>Error:</strong> r tidak boleh lebih besar dari n untuk permutasi',
                    `n = ${n}, r = ${r}`,
                    `r (${r}) > n (${n}) tidak valid untuk permutasi`
                ];
            } else {
                result = nPr(n, r);
                modeName = `Permutasi (${n}P${r})`;
                formula = `P(${n},${r}) = ${n}! / (${n}-${r})! = ${result.toLocaleString()}`;
                steps = [
                    `📌 <strong>Langkah 1:</strong> Identifikasi nilai n dan r`,
                    `n (jumlah elemen) = ${n}`,
                    `r (elemen terpilih) = ${r}`,
                    `📌 <strong>Langkah 2:</strong> Gunakan rumus permutasi`,
                    `P(n,r) = n! / (n-r)!`,
                    `📌 <strong>Langkah 3:</strong> Hitung faktorial`,
                    `${n}! = ${factorial(n).toLocaleString()}`,
                    `${n}-${r} = ${n - r}`,
                    `(${n}-${r})! = ${factorial(n - r).toLocaleString()}`,
                    `📌 <strong>Langkah 4:</strong> Bagi hasil faktorial`,
                    `P(${n},${r}) = ${factorial(n).toLocaleString()} / ${factorial(n - r).toLocaleString()} = ${result.toLocaleString()}`
                ];
                if (n <= 10 && r > 0) {
                    steps.push(`📌 <strong>Langkah alternatif:</strong> Perkalian berurutan`);
                    steps.push(`P(${n},${r}) = ${Array.from({ length: r }, (_, i) => n - i).join(' × ')} = ${result.toLocaleString()}`);
                }
            }
            break;
        case 'nCr':
            if (r > n && n > 0) {
                result = 0;
                modeName = `Kombinasi (${n}C${r})`;
                formula = `C(${n},${r}) = Tidak valid (r > n)`;
                steps = [
                    '❌ <strong>Error:</strong> r tidak boleh lebih besar dari n untuk kombinasi',
                    `n = ${n}, r = ${r}`,
                    `r (${r}) > n (${n}) tidak valid untuk kombinasi`
                ];
            } else {
                result = nCr(n, r);
                modeName = `Kombinasi (${n}C${r})`;
                formula = `C(${n},${r}) = ${n}! / (${r}! × (${n}-${r})!) = ${result.toLocaleString()}`;
                steps = [
                    `📌 <strong>Langkah 1:</strong> Identifikasi nilai n dan r`,
                    `n (jumlah elemen) = ${n}`,
                    `r (elemen terpilih) = ${r}`,
                    `📌 <strong>Langkah 2:</strong> Gunakan rumus kombinasi`,
                    `C(n,r) = n! / (r! × (n-r)!)`,
                    `📌 <strong>Langkah 3:</strong> Hitung faktorial`,
                    `${n}! = ${factorial(n).toLocaleString()}`,
                    `${r}! = ${factorial(r).toLocaleString()}`,
                    `${n}-${r} = ${n - r}`,
                    `(${n}-${r})! = ${factorial(n - r).toLocaleString()}`,
                    `📌 <strong>Langkah 4:</strong> Hitung penyebut`,
                    `r! × (n-r)! = ${factorial(r).toLocaleString()} × ${factorial(n - r).toLocaleString()} = ${(factorial(r) * factorial(n - r)).toLocaleString()}`,
                    `📌 <strong>Langkah 5:</strong> Bagi untuk mendapatkan hasil`,
                    `C(${n},${r}) = ${factorial(n).toLocaleString()} / ${(factorial(r) * factorial(n - r)).toLocaleString()} = ${result.toLocaleString()}`
                ];
            }
            break;
        case 'repetition_permutation':
            result = Math.pow(n, r);
            modeName = 'Permutasi dengan Pengulangan';
            formula = `${n}^${r} = ${result.toLocaleString()}`;
            steps = [
                `📌 <strong>Langkah 1:</strong> Identifikasi nilai n dan r`,
                `n (jumlah elemen) = ${n}`,
                `r (panjang susunan) = ${r}`,
                `📌 <strong>Langkah 2:</strong> Gunakan rumus permutasi dengan pengulangan`,
                `n^r = ${n}^${r}`,
                `📌 <strong>Langkah 3:</strong> Hitung perpangkatan`,
                `${n}^${r} = ${Array(r).fill(n).join(' × ')} = ${result.toLocaleString()}`
            ];
            break;
        case 'repetition_combination':
            if (n === 0 && r > 0) {
                result = 0;
                modeName = 'Kombinasi dengan Pengulangan';
                formula = `C(${n}+${r}-1, ${r}) = Tidak valid`;
                steps = [
                    '❌ <strong>Error:</strong> n tidak boleh 0 jika r > 0',
                    `n = ${n}, r = ${r}`,
                    'Tidak ada elemen untuk dipilih (n = 0)'
                ];
            } else {
                result = nCr(n + r - 1, r);
                modeName = 'Kombinasi dengan Pengulangan';
                formula = `C(${n}+${r}-1, ${r}) = C(${n + r - 1}, ${r}) = ${result.toLocaleString()}`;
                steps = [
                    `📌 <strong>Langkah 1:</strong> Identifikasi nilai n dan r`,
                    `n (jumlah jenis elemen) = ${n}`,
                    `r (jumlah yang dipilih) = ${r}`,
                    `📌 <strong>Langkah 2:</strong> Gunakan rumus kombinasi dengan pengulangan`,
                    `C(n+r-1, r) = C(${n}+${r}-1, ${r})`,
                    `📌 <strong>Langkah 3:</strong> Hitung nilai baru`,
                    `n + r - 1 = ${n} + ${r} - 1 = ${n + r - 1}`,
                    `📌 <strong>Langkah 4:</strong> Hitung kombinasi`,
                    `C(${n + r - 1}, ${r}) = ${result.toLocaleString()}`
                ];
            }
            break;
        case 'circular':
            if (n === 0) {
                result = 1;
                modeName = 'Permutasi Sirkular';
                formula = `(${n}-1)! = 1 (khusus untuk n=0)`;
                steps = [
                    `📌 <strong>Kasus khusus:</strong> n = 0`,
                    `Untuk 0 objek, hanya ada 1 cara penempatan (kosong)`,
                    `Hasil = 1`
                ];
            } else {
                result = factorial(Math.max(0, n - 1));
                modeName = 'Permutasi Sirkular';
                formula = `(${n}-1)! = ${result.toLocaleString()}`;
                steps = [
                    `📌 <strong>Langkah 1:</strong> Identifikasi jumlah objek`,
                    `n (jumlah objek) = ${n}`,
                    `📌 <strong>Langkah 2:</strong> Gunakan rumus permutasi sirkular`,
                    `(n-1)! = (${n}-1)!`,
                    `📌 <strong>Langkah 3:</strong> Hitung faktorial`,
                    `${n}-1 = ${n - 1}`,
                    `(${n - 1})! = ${result.toLocaleString()}`
                ];
            }
            break;
        case 'multinomial':
            const countsInput = document.getElementById('multinomial-counts').value;
            const counts = countsInput.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c));
            if (counts.length > 0) {
                const sum = counts.reduce((a, b) => a + b, 0);
                if (sum !== n) {
                    result = 0;
                    modeName = 'Multinomial';
                    formula = `${n}! / (${counts.map(c => `${c}!`).join(' × ')}) = Tidak valid`;
                    steps = [
                        '❌ <strong>Error:</strong> Jumlah kategori tidak sama dengan n',
                        `n = ${n}`,
                        `Jumlah kategori = ${counts.join(' + ')} = ${sum}`,
                        `${sum} ≠ ${n} (tidak valid)`
                    ];
                } else {
                    result = multinomial(n, counts);
                    modeName = 'Multinomial';
                    formula = `${n}! / (${counts.map(c => `${c}!`).join(' × ')}) = ${result.toLocaleString()}`;
                    steps = [
                        `📌 <strong>Langkah 1:</strong> Identifikasi jumlah total dan kategori`,
                        `n (total elemen) = ${n}`,
                        `Kategori: ${counts.map((c, i) => `Kategori ${i + 1}: ${c} elemen`).join(', ')}`,
                        `📌 <strong>Langkah 2:</strong> Gunakan rumus multinomial`,
                        `n! / (k1! × k2! × ... × km!)`,
                        `📌 <strong>Langkah 3:</strong> Hitung faktorial`,
                        `${n}! = ${factorial(n).toLocaleString()}`,
                        ...counts.map((c, i) => `Kategori ${i + 1}: ${c}! = ${factorial(c).toLocaleString()}`),
                        `📌 <strong>Langkah 4:</strong> Hitung penyebut`,
                        `Penyebut = ${counts.map(c => factorial(c)).join(' × ')} = ${counts.reduce((acc, c) => acc * factorial(c), 1).toLocaleString()}`,
                        `📌 <strong>Langkah 5:</strong> Bagi untuk mendapatkan hasil`,
                        `Hasil = ${factorial(n).toLocaleString()} / ${counts.reduce((acc, c) => acc * factorial(c), 1).toLocaleString()} = ${result.toLocaleString()}`
                    ];
                }
            } else {
                result = 0;
                modeName = 'Multinomial';
                formula = 'Masukkan jumlah kategori';
                steps = [
                    '⚠️ <strong>Peringatan:</strong> Belum memasukkan jumlah kategori',
                    'Contoh format: 2,2,1'
                ];
            }
            break;
    }

    // Update tampilan hasil
    document.getElementById('result-number').textContent = result.toLocaleString();
    document.getElementById('result-mode-label').textContent = `Mode: ${modeName.split(' (')[0]}`;
    document.getElementById('result-type').textContent = modeName;
    document.getElementById('formula-display').textContent = formula;

    // Update analisis
    const analisisContent = document.getElementById('analisis-content');
    analisisContent.innerHTML = steps.map(step => `<div class="analisis-step">${step}</div>`).join('');
    document.getElementById('analisis-section').classList.remove('hidden');

    // Tampilkan hasil
    document.getElementById('result-display').classList.remove('hidden');

    // Generate list jika diminta
    if (showList && n > 0 && r > 0 && ['nPr', 'nCr'].includes(mode)) {
        generateList(n, r, mode);
    } else {
        document.getElementById('result-list').classList.add('hidden');
    }
}

// Fungsi matematika
function factorial(n) {
    if (n < 0) return 0;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function nPr(n, r) {
    if (r > n) return 0;
    let result = 1;
    for (let i = 0; i < r; i++) {
        result *= (n - i);
    }
    return result;
}

function nCr(n, r) {
    if (r > n) return 0;
    if (r > n - r) r = n - r;
    let result = 1;
    for (let i = 1; i <= r; i++) {
        result = result * (n - r + i) / i;
    }
    return Math.round(result);
}

function multinomial(n, counts) {
    if (counts.reduce((a, b) => a + b, 0) !== n) return 0;
    let numerator = factorial(n);
    let denominator = 1;
    for (const count of counts) {
        denominator *= factorial(count);
    }
    return numerator / denominator;
}

// Fungsi untuk generate list
function generateList(n, r, mode) {
    const listElement = document.getElementById('result-list');
    listElement.innerHTML = '';

    const elementsInput = document.getElementById('elements-list').value;
    const elements = elementsInput.split(',').map(el => el.trim()).filter(el => el);
    const limit = parseInt(document.getElementById('list-limit').value) || 200;

    if (elements.length < n || n === 0 || r === 0) {
        listElement.innerHTML = '<div class="list-item">Tidak dapat membuat daftar dengan input saat ini</div>';
        listElement.classList.remove('hidden');
        return;
    }

    let combinations = [];
    const displayElements = elements.slice(0, n);

    if (mode === 'nCr') {
        // Generate kombinasi
        function combine(start, current) {
            if (current.length === r) {
                combinations.push([...current]);
                return;
            }
            for (let i = start; i < displayElements.length; i++) {
                current.push(displayElements[i]);
                combine(i + 1, current);
                current.pop();
                if (combinations.length >= limit) break;
            }
        }
        combine(0, []);
    } else if (mode === 'nPr') {
        // Generate permutasi
        function permute(current, used) {
            if (current.length === r) {
                combinations.push([...current]);
                return;
            }
            for (let i = 0; i < displayElements.length; i++) {
                if (!used[i]) {
                    used[i] = true;
                    current.push(displayElements[i]);
                    permute(current, used);
                    current.pop();
                    used[i] = false;
                    if (combinations.length >= limit) break;
                }
            }
        }
        permute([], new Array(displayElements.length).fill(false));
    }

    // Tampilkan hasil
    if (combinations.length > 0) {
        listElement.innerHTML = `<div class="list-item" style="background:rgba(59, 130, 246, 0.1); font-weight:bold;">📋 Menampilkan ${combinations.length} hasil:</div>`;

        combinations.forEach((comb, index) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.textContent = `${index + 1}. ${comb.join(', ')}`;
            listElement.appendChild(item);
        });

        if (combinations.length >= limit) {
            const limitMsg = document.createElement('div');
            limitMsg.className = 'list-item';
            limitMsg.textContent = `⚠️ Hasil dibatasi ${limit} item pertama`;
            limitMsg.style.color = '#f59e0b';
            limitMsg.style.borderLeftColor = '#f59e0b';
            listElement.appendChild(limitMsg);
        }

        listElement.classList.remove('hidden');
    } else {
        listElement.innerHTML = '<div class="list-item">Tidak ada hasil yang dapat ditampilkan</div>';
        listElement.classList.remove('hidden');
    }
}

// Fungsi untuk clear kalkulator
function clearCalculator() {
    document.getElementById('input-n').value = '0';
    document.getElementById('input-r').value = '0';
    document.getElementById('elements-list').value = '';
    document.getElementById('multinomial-counts').value = '';
    document.getElementById('user-soal').value = '';
    document.getElementById('list-results').checked = true;
    document.getElementById('list-limit').value = '200';
    document.getElementById('mode-npr').checked = true;
    document.getElementById('multinomial-controls').classList.add('hidden');

    // Reset semua tombol uji cepat
    document.querySelectorAll('.soal-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = 'var(--text)';
        btn.style.borderColor = 'var(--border)';
    });

    // Reset ke placeholder
    showResultPlaceholder();
}