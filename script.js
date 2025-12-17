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
});

// Fungsi untuk analisis soal dan hitung
function analyzeAndCalculate() {
    const soalText = document.getElementById('user-soal').value.trim();

    if (!soalText) {
        alert('Silakan masukkan soal terlebih dahulu!');
        return;
    }

    // Analisis soal untuk ekstrak n, r, dan mode
    const analisis = analyzeProblem(soalText);

    // Update input values berdasarkan analisis
    if (analisis.n !== null) {
        document.getElementById('input-n').value = analisis.n;
    }

    if (analisis.r !== null) {
        document.getElementById('input-r').value = analisis.r;
    }

    // Update mode jika terdeteksi
    if (analisis.mode) {
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            if (radio.value === analisis.mode) {
                radio.checked = true;
                if (analisis.mode === 'multinomial') {
                    document.getElementById('multinomial-controls').classList.remove('hidden');
                    if (analisis.multiCounts) {
                        document.getElementById('multinomial-counts').value = analisis.multiCounts.join(',');
                    }
                } else {
                    document.getElementById('multinomial-controls').classList.add('hidden');
                }
            }
        });
    }

    // Update elements list
    updateElementsList(analisis.n || 0, soalText);

    // Reset highlight pada tombol uji cepat
    document.querySelectorAll('.soal-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = 'var(--text)';
        btn.style.borderColor = 'var(--border)';
    });

    // Hitung dengan analisis
    calculateWithAnalisis(analisis);
}

// Fungsi untuk analisis soal
function analyzeProblem(soalText) {
    const result = {
        n: null,
        r: null,
        mode: null,
        multiCounts: null,
        keywords: []
    };

    // Ekstrak angka dari soal
    const numbers = soalText.match(/\d+/g);
    if (numbers) {
        const nums = numbers.map(Number);
        if (nums.length >= 1) result.n = nums[0];
        if (nums.length >= 2) result.r = nums[1];
    }

    // Deteksi kata kunci untuk menentukan mode
    const lowerSoal = soalText.toLowerCase();

    if (lowerSoal.includes('lingkar') || lowerSoal.includes('bundar') || lowerSoal.includes('sirkular')) {
        result.mode = 'circular';
        result.keywords.push('lingkar', 'sirkular');
    } else if (lowerSoal.includes('multinomial') || lowerSoal.includes('2,2,1') || lowerSoal.includes('berulang')) {
        result.mode = 'multinomial';
        result.keywords.push('multinomial');
        // Coba ekstrak pola multinomial
        const multiMatch = soalText.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
        if (multiMatch) {
            result.multiCounts = [parseInt(multiMatch[1]), parseInt(multiMatch[2]), parseInt(multiMatch[3])];
        }
    } else if (lowerSoal.includes('pengulangan') || lowerSoal.includes('berulang')) {
        if (lowerSoal.includes('permutasi') || lowerSoal.includes('susun')) {
            result.mode = 'repetition_permutation';
            result.keywords.push('pengulangan', 'permutasi');
        } else {
            result.mode = 'repetition_combination';
            result.keywords.push('pengulangan', 'kombinasi');
        }
    } else if (lowerSoal.includes('permutasi') || lowerSoal.includes('susun') || lowerSoal.includes('urutan')) {
        result.mode = 'nPr';
        result.keywords.push('permutasi', 'urutan');
    } else if (lowerSoal.includes('kombinasi') || lowerSoal.includes('pilih') || lowerSoal.includes('tim')) {
        result.mode = 'nCr';
        result.keywords.push('kombinasi', 'pilih');
    }

    return result;
}

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
    } else {
        // Default: angka
        const numbers = Array.from({ length: n }, (_, i) => i + 1);
        const elements = numbers.map(n => `Elemen ${n}`);
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
