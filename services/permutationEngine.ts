/**
 * BBFS Permutation Logic v2.1:
 * Memproses input angka unik dan repetisi untuk menghasilkan permutasi Single dan Twin.
 */

export const getDigitsData = (input: string) => {
  const digits = input.replace(/\D/g, '').split('');
  const counts: Record<string, number> = {};
  digits.forEach(d => counts[d] = (counts[d] || 0) + 1);
  
  const uniqueDigits = Object.keys(counts).sort();
  const repeatingDigits = Object.keys(counts).filter(d => counts[d] > 1).sort();
  
  return { uniqueDigits, repeatingDigits, counts };
};

// Single: Menggunakan angka unik, masing-masing satu kali per baris.
export const getSinglePermutations = (pool: string[], k: number): string[] => {
  if (k <= 0 || k > pool.length) return [];
  const results: string[] = [];

  const backtrack = (current: string[], used: Set<number>) => {
    if (current.length === k) {
      results.push(current.join(''));
      return;
    }

    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      used.add(i);
      current.push(pool[i]);
      backtrack(current, used);
      current.pop();
      used.delete(i);
    }
  };

  backtrack([], new Set());
  return results;
};

// Twin: Menggunakan angka sesuai frekuensi di input, khusus untuk hasil yang memiliki angka kembar.
export const getTwinPermutations = (uniquePool: string[], repeatPool: string[], k: number, inputCounts?: Record<string, number>): string[] => {
  if (k <= 1 || repeatPool.length === 0 || !inputCounts) return [];
  
  const results = new Set<string>();
  const currentCounts: Record<string, number> = {};
  uniquePool.forEach(d => currentCounts[d] = 0);

  const generate = (current: string[]) => {
    if (current.length === k) {
      const check: Record<string, number> = {};
      let hasRepeat = false;
      for (const d of current) {
        check[d] = (check[d] || 0) + 1;
        if (check[d] > 1) hasRepeat = true;
      }

      if (hasRepeat) {
        results.add(current.join(''));
      }
      return;
    }

    for (const d of uniquePool) {
      if (currentCounts[d] < (inputCounts[d] || 0)) {
        currentCounts[d]++;
        current.push(d);
        generate(current);
        current.pop();
        currentCounts[d]--;
      }
    }
  };

  if (uniquePool.length > 0 && k <= 5) {
    generate([]);
  }

  return Array.from(results).sort();
};