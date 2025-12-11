// Kalkulator Permutasi & Kombinasi (Kompleks)
// Menggunakan BigInt dan pembatalan untuk binomial dan permutasi
// Pembatasan listing untuk mencegah freeze.
// Ditambahkan: parser kata bilangan Indonesia yang lebih lengkap (mendukung "dan"),
// uji cepat (examples), confidence & highlight alasan pemilihan mode, dan perapihan show/hide.

(function(){
  // ---------- Utility BigInt helpers ----------
  function gcd(a,b){
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while(b !== 0n){
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function ltrimNumber(x){ return (typeof x === 'string') ? x.trim() : x; }

  function validateIntegerField(v){
    v = ltrimNumber(v);
    if(v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    if(!Number.isFinite(n) || Math.floor(n) !== n) return null;
    return n;
  }

  // multiplicative nPr: product n*(n-1)*...*(n-r+1)
  function nPrBig(n, r){
    if(r < 0 || r > n) return 0n;
    let res = 1n;
    for(let i=0;i<r;i++){
      res *= BigInt(n - i);
    }
    return res;
  }

  // binomial using multiplicative approach with intermediate gcd cancellations
  function nCrBig(n, r){
    if(r < 0 || r > n) return 0n;
    r = Math.min(r, n - r);
    if(r === 0) return 1n;
    let numerator = 1n;
    let denominator = 1n;
    for(let i=1;i<=r;i++){
      numerator *= BigInt(n - r + i);
      denominator *= BigInt(i);
      // cancel gcd frequently to keep numbers smaller
      const g = gcd(numerator, denominator);
      if(g > 1n){
        numerator /= g;
        denominator /= g;
      }
    }
    // denominator should be 1 now
    return numerator / denominator;
  }

  function powBig(base, exp){
    base = BigInt(base);
    exp = Number(exp);
    if(exp < 0) throw new Error("Negative exponent not supported for integer pow");
    let res = 1n;
    while(exp > 0){
      if(exp & 1) res *= base;
      base *= base;
      exp = exp >> 1;
    }
    return res;
  }

  // factorial with memoization (for moderate n)
  const factMemo = [1n];
  function factorialBig(n){
    if(n < 0) return null;
    for(let i = factMemo.length; i <= n; i++){
      factMemo[i] = factMemo[i-1] * BigInt(i);
    }
    return factMemo[n];
  }

  function multinomialBig(total, counts){
    if(counts.reduce((a,b)=>a+b,0) !== total) return null;
    let num = factorialBig(total);
    let denom = 1n;
    for(const c of counts){
      denom *= factorialBig(c);
    }
    return num / denom;
  }

  // Prime factorization for moderate BigInt (naive trial division)
  function primeFactorsBig(n){
    n = n < 0n ? -n : n;
    const limit = 1_000_000; // arbitrary safety limit
    const factors = new Map();
    if(n === 0n) return [["0",1]];
    if(n === 1n) return [["1",1]];
    let d = 2n;
    while(d * d <= n){
      while(n % d === 0n){
        factors.set(d.toString(), (factors.get(d.toString()) || 0) + 1);
        n /= d;
      }
      d = d === 2n ? 3n : d + 2n;
      // safety bail-out for huge numbers
      if(d > BigInt(limit)) break;
    }
    if(n > 1n) factors.set(n.toString(), (factors.get(n.toString())||0)+1);
    return Array.from(factors.entries());
  }

  // ---------- Listing generators (bounded) ----------
  function parseElements(text){
    if(!text) return [];
    return text.split(',').map(s=>s.trim()).filter(s=>s.length>0);
  }

  function generateCombinations(elements, r, limit){
    const n = elements.length;
    const out = [];
    if(r < 0 || r > n) return out;
    const comb = [];
    function rec(start, k){
      if(out.length >= limit) return;
      if(k === 0){
        out.push(comb.slice());
        return;
      }
      for(let i=start;i<=n-k;i++){
        comb.push(elements[i]);
        rec(i+1, k-1);
        comb.pop();
        if(out.length >= limit) return;
      }
    }
    rec(0, r);
    return out;
  }

  function generatePermutations(elements, r, limit){
    const n = elements.length;
    const out = [];
    const used = new Array(n).fill(false);
    const cur = [];
    function rec(k){
      if(out.length >= limit) return;
      if(k === r){
        out.push(cur.slice());
        return;
      }
      for(let i=0;i<n;i++){
        if(used[i]) continue;
        used[i] = true;
        cur.push(elements[i]);
        rec(k+1);
        cur.pop();
        used[i] = false;
        if(out.length >= limit) return;
      }
    }
    rec(0);
    return out;
  }

  // ---------- DOM ----------
  const el = id => document.getElementById(id);
  const inputN = el('input-n');
  const inputR = el('input-r');
  const modeRadios = Array.from(document.querySelectorAll('input[name="mode"]'));
  const multinomialControls = el('multinomial-controls');
  const multinomialCounts = el('multinomial-counts');
  const listResults = el('list-results');
  const elementsList = el('elements-list');
  const listLimit = el('list-limit');
  const btnCalc = el('btn-calc');
  const btnClear = el('btn-clear');
  const outSummary = el('output-summary');
  const outSteps = el('output-steps');
  const outList = el('output-list');

  // NLP elements
  const problemText = el('problem-text');
  const btnAnalyze = el('btn-analyze');
  const btnAnalyzeCalc = el('btn-analyze-calc');
  const btnClearAnalysis = el('btn-clear-analysis');
  const analysisOutput = el('analysis-output');
  const exampleButtons = Array.from(document.querySelectorAll('.example-btn'));

  function getMode(){ return document.querySelector('input[name="mode"]:checked').value; }

  function setMode(value){
    const radio = document.querySelector(`input[name="mode"][value="${value}"]`);
    if(radio){
      radio.checked = true;
      if(value === 'multinomial') show(multinomialControls);
      else hide(multinomialControls);
    }
  }

  function show(element){ element.classList.remove('hidden'); element.style.display = element.style.display || ''; }
  function hide(element){ element.classList.add('hidden'); element.style.display = 'none'; }

  // show/hide multinomial input when mode selected
  modeRadios.forEach(radio => radio.addEventListener('change', ()=>{
    if(getMode() === 'multinomial') show(multinomialControls);
    else hide(multinomialControls);
  }));

  btnClear.addEventListener('click', ()=>{
    inputN.value = '5';
    inputR.value = '3';
    multinomialCounts.value = '';
    elementsList.value = '';
    listResults.checked = false;
    outSummary.textContent = '';
    outSteps.textContent = '';
    outList.textContent = '';
    // also clear analysis
    problemText.value = '';
    analysisOutput.textContent = '';
    hide(analysisOutput);
  });

  btnClearAnalysis.addEventListener('click', ()=>{
    problemText.value = '';
    analysisOutput.textContent = '';
    hide(analysisOutput);
  });

  btnCalc.addEventListener('click', onCalculate);
  btnAnalyze.addEventListener('click', analyzeProblem);
  btnAnalyzeCalc.addEventListener('click', ()=>{ analyzeProblem(); onCalculate(); });

  exampleButtons.forEach(b=>{
    b.addEventListener('click', (ev)=>{
      const ex = ev.currentTarget.getAttribute('data-example');
      problemText.value = ex;
      analyzeProblem();
    });
  });

  function formatBigInt(b){
    if(b === null) return '—';
    try{
      const abs = (b<0n)? -b : b;
      if(abs < 1_000_000_000_000_000_000n) return b.toString();
      // scientific format for huge numbers
      const s = b.toString();
      const len = s.length;
      return s.slice(0,15) + "… (10^" + (len-1) + ")";
    }catch(e){ return b.toString(); }
  }

  // ---------- Natural language analysis with improved Indonesian number parser ----------
  const UNITS = {
    'nol':0,'satu':1,'se':1,'dua':2,'tiga':3,'empat':4,'lima':5,'enam':6,'tujuh':7,'delapan':8,'sembilan':9
  };

  const TEENS = {
    'sepuluh':10,'sebelas':11
  };

  const SCALES = {
    'belas': 10,
    'puluh': 10,
    'ratus': 100,
    'ribu': 1000,
    'juta': 1_000_000,
    'miliar': 1_000_000_000,
    'triliun': 1_000_000_000_000
  };

  // Accept "dan" as connector — skip it in tokenization for numbers
  function tokenizeWords(text){
    return Array.from(text.toLowerCase().matchAll(/[a-z0-9]+/g)).map(m=>m[0]).filter(t => t !== 'dan');
  }

  // Parse a contiguous sequence of Indonesian number words into an integer.
  // More robust handling of scales: accumulate current and multiply on large scales.
  function parseIndoNumberWordsSeq(tokens){
    if(!tokens || tokens.length === 0) return null;
    let total = 0;
    let current = 0;
    for(let i=0;i<tokens.length;i++){
      const t = tokens[i];
      if(/^\d+$/.test(t)){
        if(current) { total += current; current = 0; }
        total += Number(t);
        continue;
      }
      if(TEENS.hasOwnProperty(t)){
        current += TEENS[t];
        continue;
      }
      if(t === 'se'){
        // handle "se" prefix like seratus / seribu by looking ahead
        const nxt = tokens[i+1];
        if(nxt && SCALES[nxt]){
          current += SCALES[nxt];
          i++; // consume next
          continue;
        } else {
          current += 1;
          continue;
        }
      }
      if(UNITS.hasOwnProperty(t)){
        current += UNITS[t];
        continue;
      }
      if(SCALES.hasOwnProperty(t)){
        const scale = SCALES[t];
        if(scale >= 1000){
          if(current === 0) current = 1;
          current = current * scale;
          total += current;
          current = 0;
        } else if(t === 'ratus'){
          if(current === 0) current = 100;
          else current = current * 100;
        } else if(t === 'puluh'){
          if(current === 0) current = 10;
          else current = current * 10;
        } else if(t === 'belas'){
          if(current === 0) current = 11;
          else current = current + 10;
        } else {
          // fallback
        }
        continue;
      }
      // unknown token in sequence => abort
      return null;
    }
    return total + current;
  }

  function extractNumbersFromNumberWords(text){
    const words = tokenizeWords(text);
    const results = [];
    let i = 0;
    while(i < words.length){
      if(UNITS.hasOwnProperty(words[i]) || TEENS.hasOwnProperty(words[i]) || words[i] === 'se' || SCALES.hasOwnProperty(words[i]) || /^\d+$/.test(words[i])){
        // try longest window up to 10 tokens
        let matched = false;
        for(let len = Math.min(10, words.length - i); len >= 1; len--){
          const slice = words.slice(i, i+len);
          const val = parseIndoNumberWordsSeq(slice);
          if(val !== null){
            results.push({value: val, tokens: slice, start: i, end: i+len});
            i = i + len - 1;
            matched = true;
            break;
          }
        }
        if(!matched) i++;
      } else i++;
      i++;
    }
    return results;
  }

  // detect comma/space separated multinomial counts using digits OR number words
  function detectMultinomialCountsFromText(text){
    // digits first, e.g., "2,2,1" or "2 2 1"
    const commaSeq = text.match(/(?:\b\d+\b(?:\s*(?:,|\s)\s*\d+)+)/);
    if(commaSeq){
      const parts = commaSeq[0].split(/[\s,]+/).map(s=>Number(s.trim())).filter(x=>!Number.isNaN(x));
      if(parts.length >= 2) return parts;
    }

    // try groups of number-words separated by commas or spaces
    // gather all number-word matches
    const cand = extractNumbersFromNumberWords(text);
    if(cand && cand.length >= 2){
      const parts = cand.map(o=>o.value);
      if(parts.length >= 2) return parts;
    }

    return null;
  }

  function getDigitsFromText(text){
    // return list of numeric values from digits in text (e.g., "8 siswa pilih 3" -> [8,3])
    const allNums = Array.from((text.matchAll(/\b(\d+)\b/g))).map(m=>Number(m[1]));
    return allNums;
  }

  // ---------- Listing of keywords ----------
  const permutationKeys = ['permutasi','urutan','susunan','susun','arrange','berurutan','menyusun','permutation','ordered','susunannya','susunan berbeda'];
  const combinationKeys = ['kombinasi','pilih','tanpa urutan','combination','subset','cara memilih','berapa cara memilih','dipilih','pemilihan','tanpa memperhatikan urutan'];
  const repetitionKeys = ['pengulangan','boleh berulang','dengan pengulangan','ulang','replacement','dapat berulang','bisa berulang','diperbolehkan berulang','diperbolehkan sama','boleh sama'];
  const circularKeys = ['sirkular','melingkar','lingkar','round table','kursi melingkar','sirkuler','meja bundar'];
  const multinomialKeys = ['identik','tak dibedakan','tidak dibedakan','sama','berulang tipe','multinomial','objek sama','objek tidak dibedakan','tipe sama'];

  // helper: find and count plain substring matches
  function countMatches(text, keys){
    const lower = text.toLowerCase();
    let c = 0;
    for(const k of keys) if(lower.includes(k)) c++;
    return c;
  }

  // ---------- Highlighting helpers ----------
  function escapeHtml(str){
    return str.replace(/[&<>"']/g, function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }

  // Collect all match ranges (keywords, digits, number-words, multinomial sequences)
  function collectMatches(raw){
    const lc = raw.toLowerCase();
    const matches = [];

    // keywords: push occurrences with type
    function pushKeywordMatches(keys, type){
      for(const k of keys){
        const re = new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
        let m;
        while((m = re.exec(raw)) !== null){
          matches.push({start: m.index, end: m.index + m[0].length, type, text: m[0]});
          // avoid infinite loops for zero-length
          if(re.lastIndex === m.index) re.lastIndex++;
        }
      }
    }
    pushKeywordMatches(permutationKeys, 'permutation');
    pushKeywordMatches(combinationKeys, 'combination');
    pushKeywordMatches(repetitionKeys, 'repetition');
    pushKeywordMatches(circularKeys, 'circular');
    pushKeywordMatches(multinomialKeys, 'multinomial');

    // digits (numbers)
    const digitRe = /\b\d+\b/g;
    let dm;
    while((dm = digitRe.exec(raw)) !== null){
      matches.push({start: dm.index, end: dm.index + dm[0].length, type: 'number', text: dm[0]});
    }

    // multinomial digit-sequence like "2,2,1"
    const commaSeq = raw.match(/(?:\b\d+\b(?:\s*(?:,|\s)\s*\d+)+)/);
    if(commaSeq){
      const idx = raw.indexOf(commaSeq[0]);
      matches.push({start: idx, end: idx + commaSeq[0].length, type: 'multinomial-seq', text: commaSeq[0]});
    }

    // number-word matches: use extractNumbersFromNumberWords but need original indices; we approximate by finding token text in raw
    const wordNumObjs = extractNumbersFromNumberWords(raw);
    for(const o of wordNumObjs){
      const snippet = o.tokens.join(' ');
      // find first occurrence of the snippet (best-effort)
      const re = new RegExp('\\b' + snippet.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b', 'i');
      const m = re.exec(raw);
      if(m){
        matches.push({start: m.index, end: m.index + m[0].length, type: 'number-word', text: m[0], value: o.value});
      }
    }

    // merge overlapping and sort
    matches.sort((a,b)=>a.start - b.start || b.end - a.end);
    const merged = [];
    for(const m of matches){
      if(merged.length === 0) merged.push(m);
      else {
        const last = merged[merged.length-1];
        if(m.start <= last.end){ // overlap
          if(m.end > last.end){
            // extend last.end and combine types (append)
            last.end = m.end;
            last.text = raw.slice(last.start, last.end);
            last.type = last.type + ',' + m.type;
          }
        } else merged.push(m);
      }
    }
    return merged;
  }

  // Build highlighted HTML from raw and matches
  function highlightRaw(raw, matches){
    if(!matches || matches.length === 0) return escapeHtml(raw);
    let out = '';
    let idx = 0;
    for(const m of matches){
      if(m.start > idx) out += escapeHtml(raw.slice(idx, m.start));
      const cls = 'highlight ' + (m.type ? m.type.split(',')[0] : 'match');
      const displayText = escapeHtml(raw.slice(m.start, m.end));
      const tooltip = (m.type ? m.type : '') + (m.value ? (' — ' + m.value) : '');
      out += `<span class="${cls}" title="${escapeHtml(tooltip)}">${displayText}</span>`;
      idx = m.end;
    }
    if(idx < raw.length) out += escapeHtml(raw.slice(idx));
    return out;
  }

  // Confidence calculation based on keyword counts and numeric detection (heuristic)
  function computeConfidence(raw, scores, hasNumber, hasMultinomialSeq){
    // scores: {pScore,cScore,rScore,circScore,multiScore}
    let score = 0;
    // weight keywords
    score += Math.min(10, scores.pScore * 2);
    score += Math.min(10, scores.cScore * 2);
    score += Math.min(10, scores.rScore * 2);
    score += Math.min(10, scores.circScore * 3);
    score += Math.min(10, scores.multiScore * 3);
    // presence of explicit numbers increases confidence
    if(hasNumber) score += 20;
    if(hasMultinomialSeq) score += 10;
    // normalize to 100
    const percent = Math.min(100, score);
    let label = 'Low';
    if(percent >= 75) label = 'High';
    else if(percent >= 40) label = 'Medium';
    return {percent, label};
  }

  // ---------- Analyze problem ----------
  function analyzeProblem(){
    const raw = (problemText.value || '').trim();
    if(!raw){
      analysisOutput.innerHTML = '<div class="bad">Masukkan teks soal terlebih dahulu.</div>';
      show(analysisOutput);
      return;
    }

    const lower = raw.toLowerCase();
    // numeric extraction
    const digitNums = getDigitsFromText(lower); // e.g., [8,3]
    const wordNumObjs = extractNumbersFromNumberWords(lower); // array of {value,...}
    const wordNums = wordNumObjs.map(o=>o.value);

    // Scores from keywords
    const pScore = countMatches(lower, permutationKeys);
    const cScore = countMatches(lower, combinationKeys);
    const rScore = countMatches(lower, repetitionKeys);
    const circScore = countMatches(lower, circularKeys);
    const multiScore = countMatches(lower, multinomialKeys);

    // Heuristics to decide mode
    let decidedMode = null;

    if(circScore > 0) decidedMode = 'circular';
    else if(multiScore > 0) decidedMode = 'multinomial';

    if(!decidedMode){
      if(rScore > 0 && pScore > 0) decidedMode = 'repetition_permutation';
      else if(rScore > 0 && cScore > 0) decidedMode = 'repetition_combination';
      else if(pScore > cScore && pScore > 0) decidedMode = 'nPr';
      else if(cScore > pScore && cScore > 0) decidedMode = 'nCr';
    }

    if(!decidedMode){
      if(lower.includes('tanpa urutan') || lower.includes('tidak berurutan') || lower.includes('tanpa memperhatikan urutan')) decidedMode = 'nCr';
      else if(lower.includes('urutan') || lower.includes('susunan') || lower.includes('berurutan')) decidedMode = 'nPr';
    }

    if(!decidedMode){
      if(lower.includes('pilih')) decidedMode = 'nCr';
      else if(lower.includes('susun')) decidedMode = 'nPr';
    }

    // detect explicit multinomial counts like "2,2,1" or "dua dua satu"
    const multinomialCountsDetected = detectMultinomialCountsFromText(raw);

    // detect element lists (A,B,C or kata singkat)
    let elemsDetected = null;
    const lettersComma = raw.match(/([A-Za-z0-9]{1,3}(?:\s*,\s*[A-Za-z0-9]{1,3}){2,})/);
    if(lettersComma) elemsDetected = lettersComma[0].split(',').map(s=>s.trim());
    else {
      const afterDaftar = raw.match(/daftar[:\s]\s*([A-Za-z0-9](?:[\s,][A-Za-z0-9]){2,})/i);
      if(afterDaftar) elemsDetected = afterDaftar[1].split(/[\s,]+/).map(s=>s.trim());
    }

    // Map numbers to n and r using priority:
    // 1) explicit "n=" and "r=" patterns
    // 2) Multinomial (if decided) sets n from sum of counts, r=0
    // 3) digit numbers (left-to-right)
    // 4) word numbers (left-to-right, as detected)
    let nGuess = null, rGuess = null;
    const nMatch = lower.match(/n\s*[:=]\s*(\d+)/i);
    const rMatch = lower.match(/r\s*[:=]\s*(\d+)/i);
    
    // 1) Explicit
    if(nMatch) nGuess = Number(nMatch[1]);
    if(rMatch) rGuess = Number(rMatch[1]);

    // 2) Multinomial override: Sum counts for N in multinomial mode
    //    Ini adalah perbaikan krusial untuk kasus 'objek tak dibedakan'
    if(decidedMode === 'multinomial' && multinomialCountsDetected && multinomialCountsDetected.length > 0){
        const sum = multinomialCountsDetected.reduce((a,b)=>a+b,0);
        // Hanya override n jika belum diset secara eksplisit
        if(nGuess === null) nGuess = sum;
        if(rGuess === null) rGuess = 0;
    }

    // 3 & 4) Digits/Words fallback (Only if not set by explicit/multinomial)
    const combinedNums = [].concat(digitNums, wordNums);
    if(nGuess === null && combinedNums.length > 0) nGuess = combinedNums[0];
    if(rGuess === null && combinedNums.length > 1) rGuess = combinedNums[1];

    // Fill inputs if detected
    if(typeof nGuess === 'number' && !Number.isNaN(nGuess)) inputN.value = String(nGuess);
    if(typeof rGuess === 'number' && !Number.isNaN(rGuess)) inputR.value = String(rGuess);
    if(elemsDetected && elemsDetected.length>0) elementsList.value = elemsDetected.join(',');
    if(multinomialCountsDetected && multinomialCountsDetected.length>0) multinomialCounts.value = multinomialCountsDetected.join(',');

    if(decidedMode) setMode(decidedMode);

    // prepare highlighting and confidence
    const matches = collectMatches(raw);
    const highlighted = highlightRaw(raw, matches);
    const scores = {pScore, cScore, rScore, circScore, multiScore};
    const hasNumber = digitNums.length > 0 || wordNums.length > 0;
    const hasMultSeq = Boolean(multinomialCountsDetected);
    const conf = computeConfidence(raw, scores, hasNumber, hasMultSeq);

    // Build report (HTML)
    const parts = [];
    parts.push(`<div class="analysis-top"><div class="analysis-text">${highlighted}</div><div class="confidence-bubble">Confidence: <strong>${conf.percent}%</strong> <span class="conf-label">${conf.label}</span></div></div>`);
    parts.push(`<div class="analysis-reasons"><strong>Alasan / detail:</strong>`);
    parts.push(`<ul>`);
    parts.push(`<li>Skor keyword — permutasi: ${pScore}, kombinasi: ${cScore}, pengulangan: ${rScore}, sirkular: ${circScore}, multinomial: ${multiScore}</li>`);
    parts.push(`<li>Angka terdeteksi (digit): ${digitNums.length>0 ? digitNums.join(', ') : 'tidak ada'}</li>`);
    parts.push(`<li>Angka terdeteksi (kata): ${wordNums.length>0 ? wordNums.join(', ') : 'tidak ada'}</li>`);
    if(multinomialCountsDetected) parts.push(`<li>Deretan multinomial terdeteksi: [${multinomialCountsDetected.join(', ')}]</li>`);
    if(elemsDetected) parts.push(`<li>Daftar elemen terdeteksi: ${elemsDetected.join(',')}</li>`);
    if(decidedMode) parts.push(`<li>Mode yang dipilih otomatis: <strong>${decidedMode}</strong></li>`);
    parts.push(`</ul>`);
    parts.push(`<div class="note">Catatan: Ini heuristik. Jika hasil tidak sesuai, ubah n/r atau pilih mode secara manual lalu tekan "Hitung".</div>`);
    parts.push(`</div>`);

    analysisOutput.innerHTML = parts.join('\n');
    show(analysisOutput);
  }

  // ---------- Main calculate function (unchanged) ----------
  function onCalculate(){
    outSummary.textContent = '';
    outSteps.textContent = '';
    outList.textContent = '';

    const nVal = validateIntegerField(inputN.value);
    const rVal = validateIntegerField(inputR.value);

    if(nVal === null || nVal < 0){
      outSummary.innerHTML = `<div class="bad">Error: n harus bilangan bulat >= 0</div>`;
      return;
    }
    if(rVal === null || rVal < 0){
      outSummary.innerHTML = `<div class="bad">Error: r harus bilangan bulat >= 0</div>`;
      return;
    }

    const mode = getMode();
    const showList = listResults.checked;
    const elems = parseElements(elementsList.value);
    const limit = Math.max(1, Math.min(5000, Number(listLimit.value) || 200));

    // compute
    let result = null;
    let formula = '';
    let steps = '';
    let list = [];

    try{
      switch(mode){
        case 'nPr': {
          if(rVal > nVal){ outSummary.innerHTML = `<div class="bad">Error: r tidak boleh > n untuk nPr</div>`; return; }
          result = nPrBig(nVal, rVal);
          formula = `P(n,r) = n × (n-1) × ... × (n-r+1)`;
          steps = `P(${nVal},${rVal}) = product dari ${nVal} hingga ${nVal - rVal + 1}\nHasil (BigInt): ${formatBigInt(result)}`;
          if(showList && elems.length >= rVal && elems.length === nVal){
            list = generatePermutations(elems, rVal, limit);
          }
          break;
        }
        case 'nCr': {
          if(rVal > nVal){ outSummary.innerHTML = `<div class="bad">Error: r tidak boleh > n untuk nCr</div>`; return; }
          result = nCrBig(nVal, rVal);
          formula = `C(n,r) = n! / (r! (n-r)!)`;
          steps = `C(${nVal},${rVal})\nMenghitung dengan metode multiplicative dan pembatalan gcd untuk menjaga ukuran antara.\nHasil: ${formatBigInt(result)}`;
          if(showList && elems.length >= rVal && elems.length === nVal){
            list = generateCombinations(elems, rVal, limit);
          }
          break;
        }
        case 'repetition_permutation': {
          result = powBig(nVal, rVal);
          formula = `Permutasi dengan pengulangan: n^r`;
          steps = `${nVal}^${rVal} = ${formatBigInt(result)}`;
          if(showList && elems.length > 0){
            // generate all r-length sequences with repetition allowed
            const cap = limit;
            function rec(seq){
              if(list.length >= cap) return;
              if(seq.length === rVal){ list.push(seq.slice()); return; }
              for(let i=0;i<elems.length;i++){
                seq.push(elems[i]);
                rec(seq);
                seq.pop();
                if(list.length >= cap) return;
              }
            }
            rec([]);
          }
          break;
        }
        case 'repetition_combination': {
          // C(n+r-1, r)
          result = nCrBig(nVal + rVal - 1, rVal);
          formula = `Kombinasi dengan pengulangan = C(n+r-1, r)`;
          steps = `C(${nVal + rVal - 1}, ${rVal}) = ${formatBigInt(result)}`;
          // listing combinations with repetition is combinations of multiset - not implemented listing for big sizes
          if(showList && elems.length >= 1){
            // naive generation using recursion (sorted by indices)
            const cap = limit;
            function rec(start, k, cur){
              if(list.length >= cap) return;
              if(k === 0){ list.push(cur.slice()); return; }
              for(let i=start;i<elems.length;i++){
                cur.push(elems[i]);
                rec(i, k-1, cur);
                cur.pop();
                if(list.length >= cap) return;
              }
            }
            rec(0, rVal, []);
          }
          break;
        }
        case 'circular': {
          if(nVal === 0){ result = 1n; }
          else result = factorialBig(Math.max(0, nVal - 1));
          formula = `Permutasi sirkular: (n-1)! (untuk objek berbeda)`;
          steps = `(n-1)! untuk n=${nVal} => (${nVal - 1})! = ${formatBigInt(result)}`;
          if(showList && elems.length === nVal){
            // list circular permutations by fixing first element to elems[0] and permuting others
            const others = elems.slice(1);
            const perms = generatePermutations(others, others.length, limit);
            list = perms.map(p=>[elems[0], ...p]);
          }
          break;
        }
        case 'multinomial': {
          // parse counts
          const raw = multinomialCounts.value.trim();
          if(raw.length === 0){ outSummary.innerHTML = `<div class="bad">Error: Masukkan jumlah tiap tipe (contoh "2,2,1")</div>`; return; }
          const parts = raw.split(',').map(s=>Number(s.trim())).filter(x=>!Number.isNaN(x) && Number.isFinite(x));
          // VALIDASI KRUSIAL
          const partsSum = parts.reduce((a,b)=>a+b,0);
          if(partsSum !== nVal){ outSummary.innerHTML = `<div class="bad">Error: Jumlah bagian (${partsSum}) harus sama dengan n (${nVal})</div>`; return; }
          if(parts.some(x=>x<0 || Math.floor(x)!==x)){ outSummary.innerHTML = `<div class="bad">Error: Semua bagian harus bilangan bulat >= 0</div>`; return; }
          
          result = multinomialBig(nVal, parts);
          formula = `Multinomial: n! / (a! b! c! ...) untuk jumlah a,b,c...`;
          steps = `Total n=${nVal}, bagian = [${parts.join(',')}]\nHasil: ${formatBigInt(result)}`;
          if(showList && elems.length === nVal){
            // listing distinct permutations with repeated elements (naive, may be huge) - we generate lexicographic permutations up to limit
            const pool = [];
            for(let i=0;i<parts.length;i++){
              for(let j=0;j<parts[i];j++){
                pool.push(`T${i+1}`);
              }
            }
            pool.sort();
            const cap = limit;
            function nextPermutation(a){
              let i = a.length - 2;
              while(i>=0 && a[i] >= a[i+1]) i--;
              if(i < 0) return false;
              let j = a.length - 1;
              while(a[j] <= a[i]) j--;
              [a[i], a[j]] = [a[j], a[i]];
              let l = i+1, r = a.length-1;
              while(l<r){ [a[l], a[r]] = [a[r], a[l]]; l++; r--; }
              return true;
            }
            const a = pool.slice();
            list.push(a.slice());
            while(list.length < cap && nextPermutation(a)){
              list.push(a.slice());
            }
          }
          break;
        }
        default:
          outSummary.innerHTML = `<div class="bad">Mode tidak dikenali</div>`;
          return;
      }

      // Summary card
      let html = '';
      html += `<div class="output-badge">Mode: ${mode}</div>`;
      html += `<div class="small">n=${nVal}, r=${rVal}</div>`;
      html += `<div style="margin-top:8px;"><strong>Hasil: </strong><span>${formatBigInt(result)}</span></div>`;
      outSummary.innerHTML = html;

      // Steps card
      let stepsText = `Formula: ${formula}\n\n${steps}\n\n`;
      // if result not too huge, show factorization (best-effort)
      try{
        const asBig = result;
        const approxLimit = 10_000_000_000_000_000_000n; // if > ~1e19 skip
        if(asBig !== null && (asBig < approxLimit && asBig > -approxLimit)){
          const pf = primeFactorsBig(asBig);
          if(pf && pf.length>0){
            stepsText += `Prime factors:\n`;
            pf.forEach(([p, e]) => {
              stepsText += `${p}^${e} `;
            });
            stepsText += `\n\n`;
          }
        } else {
          stepsText += `Prime factors: (skipped karena hasil terlalu besar)\n\n`;
        }
      }catch(e){
        stepsText += `Prime factors: (gagal menghitung: ${e.message})\n\n`;
      }

      outSteps.textContent = stepsText;

      // List
      if(showList){
        if(list.length === 0){
          outList.textContent = '(Daftar tidak tersedia atau kosong — pastikan jumlah elemen cocok dengan n dan opsi listing didukung)';
        } else {
          // format list items
          const lines = list.map(it => Array.isArray(it) ? it.join(',') : String(it));
          outList.textContent = `Menampilkan ${lines.length}/${(list.length>=limit? '>= '+limit : list.length)} item:\n\n` + lines.join('\n');
        }
      }

    }catch(err){
      outSummary.innerHTML = `<div class="bad">Error saat menghitung: ${err.message}</div>`;
      outSteps.textContent = (err.stack || String(err));
    }
  }

})();