import Anthropic from '@anthropic-ai/sdk'
import type { BrainBreak, Lesson } from './types'

// Two sensory breaks per lesson, after pages 3 and 6. Hangman and word
// search use the lesson's own spelling words (no AI needed); picture match
// and tic-tac-toe get topic emoji from one low-cost model call.

const BREAK_AFTER = [3, 6]

function keywordsOf(lesson: Lesson): string[] {
  const words: string[] = []
  for (const h of lesson.hunks) {
    // Skip pronunciation guides in parentheses, e.g. "KHUFU (KOO-foo)".
    const text = h.text.replace(/\([^)]*\)/g, ' ')
    for (const m of text.match(/\b[A-Z][A-Z'-]{2,}\b/g) ?? []) {
      const w = m.replace(/[^A-Z]/g, '')
      if (w.length >= 3 && !words.includes(w)) words.push(w)
    }
  }
  return words
}

function isYoung(ageGroup: string): boolean {
  return /young children|6.8/i.test(ageGroup)
}

function maxWordLength(ageGroup: string): number {
  if (isYoung(ageGroup)) return 5
  if (/children|9.11/i.test(ageGroup)) return 7
  if (/tween|12.14/i.test(ageGroup)) return 9
  return 12
}

async function topicEmoji(lesson: Lesson): Promise<{ pairs: { a: string; aLabel: string; b: string; bLabel: string }[]; x: string; o: string } | null> {
  try {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-haiku-5-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `A lesson titled "${lesson.title}" for ${lesson.ageGroup}. Create emoji for two quick games.

1. A picture-matching game: ${isYoung(lesson.ageGroup) ? 4 : 5} pairs of things that go together and relate to the topic (like a fire truck 🚒 and a firefighter helmet ⛑️). Each side is ONE emoji plus a 1–3 word label. Use common emoji that display on phones and tablets.
2. Two different topic emoji to use instead of X and O in tic-tac-toe.

Reply with ONLY JSON in this shape:
{"pairs":[{"a":"🚒","aLabel":"Fire truck","b":"⛑️","bLabel":"Helmet"}],"x":"🦖","o":"🌋"}`,
      }],
    })
    const text = message.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('')
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    if (!Array.isArray(json.pairs) || json.pairs.length < 3 || !json.x || !json.o) return null
    return { pairs: json.pairs.slice(0, 6), x: String(json.x), o: String(json.o) }
  } catch {
    return null
  }
}

export async function addBrainBreaks(lesson: Lesson): Promise<Lesson> {
  const maxLen = maxWordLength(lesson.ageGroup)
  const words = keywordsOf(lesson).filter(w => w.length <= maxLen)
  const emoji = await topicEmoji(lesson)

  const options: BrainBreak[] = []
  // Alternate a word game with a picture/play game.
  const hangmanWord = words.find(w => w.length >= 4) ?? words[0]
  if (hangmanWord) options.push({ type: 'hangman', word: hangmanWord, hint: `A word from this lesson (${hangmanWord.length} letters)` })
  if (emoji) options.push({ type: 'match', pairs: emoji.pairs })
  const searchWords = words.filter(w => w !== hangmanWord).slice(0, isYoung(lesson.ageGroup) ? 4 : 6)
  if (searchWords.length >= 3) {
    options.push({ type: 'wordsearch', words: searchWords, size: isYoung(lesson.ageGroup) ? 7 : Math.min(12, Math.max(9, ...searchWords.map(w => w.length + 1))) })
  }
  options.push({ type: 'tictactoe', x: emoji?.x ?? '❌', o: emoji?.o ?? '⭕' })

  // Pick 2, varying from lesson to lesson: a word game (Word Guess or Word
  // Search), then a picture/play game (Picture Match most often, else
  // Tic-Tac-Toe).
  const pickOne = (list: BrainBreak[]) => list[Math.floor(Math.random() * list.length)]
  const wordGames = options.filter(o => o.type === 'hangman' || o.type === 'wordsearch')
  const match = options.find(o => o.type === 'match')
  const ttt = options.find(o => o.type === 'tictactoe')
  const wordGame = wordGames.length ? pickOne(wordGames) : undefined
  const playGame = match && (!ttt || Math.random() < 0.7) ? match : ttt
  const picks = [wordGame, playGame].filter((o): o is BrainBreak => !!o)

  return {
    ...lesson,
    hunks: lesson.hunks.map(h => {
      const idx = BREAK_AFTER.indexOf(h.number)
      return idx >= 0 && picks[idx] ? { ...h, brainBreak: picks[idx] } : h
    }),
  }
}
