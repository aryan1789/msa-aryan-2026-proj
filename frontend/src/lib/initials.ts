// 1–2 letter avatar mark shared by the user chip, scoreboard rows, and crew
// tiles. Multi-word names use the first letter of the first two words
// ("Ada Lovelace" → "AL"); single words use their first two letters
// ("Ironclad" → "IR"). Empty input yields "".
export function monogram(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  const chars =
    words.length > 1 ? [words[0][0], words[1][0]] : [words[0]?.[0], words[0]?.[1]]
  return chars.filter(Boolean).join("").toUpperCase()
}
