// Utility to normalize spoken numbers (e.g., 'five' => '5', 'Four' => '4', etc.)
export function normalizeSpokenNumber(input: string, lang: string = 'en'): string {
  if (!input) return input;
  // Extendable: add more languages as needed
  let map: Record<string, string> = {};
  if (lang.startsWith('en')) {
    map = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
      'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
      'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90', 'hundred': '100',
    };
  } else if (lang.startsWith('hi')) {
    // Hindi
    map = { 'shoonya': '0', 'ek': '1', 'do': '2', 'teen': '3', 'char': '4', 'paanch': '5', 'chhe': '6', 'saat': '7', 'aath': '8', 'nau': '9', 'das': '10' };
  } else if (lang.startsWith('bn')) {
    // Bengali
    map = { 'shunyo': '0', 'ek': '1', 'dui': '2', 'tin': '3', 'char': '4', 'pach': '5', 'chhoy': '6', 'sat': '7', 'aath': '8', 'noy': '9', 'dosh': '10' };
  } else if (lang.startsWith('ta')) {
    // Tamil
    map = { 'suzhi': '0', 'ondru': '1', 'irandu': '2', 'moondru': '3', 'naangu': '4', 'aindhu': '5', 'aaru': '6', 'ezhu': '7', 'ettu': '8', 'onbadhu': '9', 'pathu': '10' };
  } else if (lang.startsWith('te')) {
    // Telugu
    map = { 'sonne': '0', 'okati': '1', 'rendu': '2', 'moodu': '3', 'naalugu': '4', 'aidu': '5', 'aaru': '6', 'edu': '7', 'enimidi': '8', 'tommidi': '9', 'padi': '10' };
  } else if (lang.startsWith('mr')) {
    // Marathi
    map = { 'shunya': '0', 'ek': '1', 'don': '2', 'teen': '3', 'char': '4', 'panch': '5', 'saha': '6', 'sat': '7', 'aath': '8', 'nau': '9', 'daha': '10' };
  } else if (lang.startsWith('gu')) {
    // Gujarati
    map = { 'shunya': '0', 'ek': '1', 'be': '2', 'tran': '3', 'char': '4', 'panch': '5', 'chh': '6', 'sat': '7', 'aath': '8', 'nav': '9', 'das': '10' };
  } else if (lang.startsWith('kn')) {
    // Kannada
    map = { 'sonne': '0', 'ondu': '1', 'eradu': '2', 'mooru': '3', 'naalku': '4', 'aidu': '5', 'aaru': '6', 'elu': '7', 'entu': '8', 'ombattu': '9', 'hattu': '10' };
  } else if (lang.startsWith('ml')) {
    // Malayalam
    map = { 'poojyam': '0', 'onnu': '1', 'randu': '2', 'moonu': '3', 'naalu': '4', 'anju': '5', 'aaru': '6', 'ezhu': '7', 'ettu': '8', 'onpathu': '9', 'pathu': '10' };
  } else if (lang.startsWith('pa')) {
    // Punjabi
    map = { 'sifar': '0', 'ikk': '1', 'do': '2', 'tin': '3', 'char': '4', 'panj': '5', 'chhe': '6', 'sat': '7', 'atth': '8', 'nau': '9', 'das': '10' };
  } else if (lang.startsWith('ur')) {
    // Urdu
    map = { 'sifr': '0', 'aik': '1', 'do': '2', 'teen': '3', 'char': '4', 'paanch': '5', 'chay': '6', 'saat': '7', 'aath': '8', 'nau': '9', 'das': '10' };
  }
  let normalized = input.toLowerCase().trim();
  // Handle spelled-out numbers like 'f i v e' -> 'five', 't w o' -> 'two', 'o n e' -> 'one', etc.
  // Also handle extra/multiple spaces and mixed case
  normalized = normalized.replace(/\b([a-z])\s+([a-z])\s+([a-z])\s+([a-z])\b/g, (m, a, b, c, d) => {
    const joined = `${a}${b}${c}${d}`;
    if (map[joined]) return joined;
    return m;
  });
  normalized = normalized.replace(/\b([a-z])\s+([a-z])\s+([a-z])\b/g, (m, a, b, c) => {
    const joined = `${a}${b}${c}`;
    if (map[joined]) return joined;
    return m;
  });
  normalized = normalized.replace(/\b([a-z])\s+([a-z])\s+([a-z])\s+([a-z])\s+([a-z])\b/g, (m, a, b, c, d, e) => {
    const joined = `${a}${b}${c}${d}${e}`;
    if (map[joined]) return joined;
    return m;
  });
  // Handle numbers with spaces, e.g., '1 0' -> '10'
  normalized = normalized.replace(/\b(\d)\s+(\d)\b/g, (m, a, b) => `${a}${b}`);
  // Replace number words with digits (handle compound numbers like 'twenty one')
  Object.entries(map).forEach(([word, digit]) => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  });
  // Handle compound numbers (e.g., 'twenty one' -> '21', 'thirty five' -> '35')
  normalized = normalized.replace(/\b(20|30|40|50|60|70|80|90)\s(1|2|3|4|5|6|7|8|9)\b/g, (m, tens, ones) => `${tens}${ones}`);
  // Handle 'one hundred'
  normalized = normalized.replace(/\b1\s?0{2}\b/g, '100');
  // Handle numbers with spaces, e.g., '1 0' -> '10', '2 5' -> '25'
  normalized = normalized.replace(/\b(\d)\s+(\d)\b/g, (m, a, b) => `${a}${b}`);
  return normalized;
}
