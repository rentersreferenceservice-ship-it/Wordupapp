// Deterministic sentence-start capitalization for notes. Dictation software
// usually leaves every sentence lowercase, and notes that never go through
// the AI conversion kept it. Only ever capitalizes — never changes words or
// lowercases anything — so it's safe to run on any text, any number of times.
export function fixCapitalization(text: string): string {
  return text
    // First letter of the note, and the first letter after a sentence end
    // (. ! ?) or a line break. Only letters directly after whitespace, so
    // "3.5 miles" and "e.g." mid-word are left alone.
    .replace(/(^\s*|[.!?]\s+|\n\s*)([a-z])/g, (_m, before: string, letter: string) => before + letter.toUpperCase())
    // A lone "i" and its contractions: i, i'm, i've, i'll, i'd
    .replace(/(^|[^\w'’])i(?=$|[^\w'’]|['’](?:m|ve|ll|d)\b)/g, (_m, before: string) => before + 'I')
}
