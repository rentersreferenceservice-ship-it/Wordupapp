import type { BrainBreak, GameStyle } from '@/lib/types'
import { PUZZLE_SETS, simpleScene } from './EyeHandGames'

// Progressive level ladders for the Ocular Motor Games. Each level is a
// little harder than the last (more pieces, smaller targets, more steps),
// and many levels change the content too, so it doesn't feel like the same
// game over and over.

// Ready-made "goes together" sets for Picture Match.
export const MATCH_SETS: { label: string; pairs: { a: string; aLabel: string; b: string; bLabel: string }[] }[] = [
  { label: '🚒 Helpers', pairs: [
    { a: '🚒', aLabel: 'Fire truck', b: '⛑️', bLabel: 'Fire hat' }, { a: '🚓', aLabel: 'Police car', b: '👮', bLabel: 'Police officer' },
    { a: '🚑', aLabel: 'Ambulance', b: '🩺', bLabel: 'Stethoscope' }, { a: '📬', aLabel: 'Mailbox', b: '✉️', bLabel: 'Letter' },
    { a: '🚌', aLabel: 'School bus', b: '🎒', bLabel: 'Backpack' } ] },
  { label: '🐝 Animals & homes', pairs: [
    { a: '🐝', aLabel: 'Bee', b: '🍯', bLabel: 'Honey' }, { a: '🐦', aLabel: 'Bird', b: '🪺', bLabel: 'Nest' },
    { a: '🐟', aLabel: 'Fish', b: '🌊', bLabel: 'Water' }, { a: '🐶', aLabel: 'Dog', b: '🦴', bLabel: 'Bone' },
    { a: '🐰', aLabel: 'Rabbit', b: '🥕', bLabel: 'Carrot' } ] },
  { label: '☔ Weather & clothes', pairs: [
    { a: '🌧️', aLabel: 'Rain', b: '☂️', bLabel: 'Umbrella' }, { a: '❄️', aLabel: 'Snow', b: '🧤', bLabel: 'Gloves' },
    { a: '☀️', aLabel: 'Sun', b: '🕶️', bLabel: 'Sunglasses' }, { a: '🌬️', aLabel: 'Wind', b: '🪁', bLabel: 'Kite' },
    { a: '🏖️', aLabel: 'Beach', b: '🩱', bLabel: 'Swimsuit' } ] },
  { label: '🍳 Kitchen', pairs: [
    { a: '🥣', aLabel: 'Cereal', b: '🥄', bLabel: 'Spoon' }, { a: '🍞', aLabel: 'Bread', b: '🧈', bLabel: 'Butter' },
    { a: '☕', aLabel: 'Coffee', b: '🫖', bLabel: 'Pot' }, { a: '🥚', aLabel: 'Eggs', b: '🍳', bLabel: 'Frying pan' },
    { a: '🍝', aLabel: 'Spaghetti', b: '🍴', bLabel: 'Fork' } ] },
]

export function levelsFor(game: string, style: GameStyle = 'playful'): BrainBreak[] {
  const grown = style === 'grownup'
  switch (game) {
    case 'cardmatch':
      return [2, 3, 4, 5, 6, 7, 8, 9, 10].map(pairs => ({ type: 'cardmatch', pairs, style }))
    case 'bubbles':
      return ([[5, 'large'], [8, 'large'], [10, 'large'], [10, 'medium'], [12, 'medium'], [15, 'medium'], [12, 'small'], [15, 'small'], [20, 'small']] as const)
        .map(([count, size]) => ({ type: 'bubbles', count, size, style }))
    case 'maze':
      return [3, 4, 4, 5, 5, 6, 7, 8, 9, 10].map(cells => ({ type: 'maze', cells, mode: 'slide', style }))
    case 'leftright':
      return ([[6, 'large'], [8, 'large'], [10, 'large'], [10, 'medium'], [12, 'medium'], [15, 'medium'], [12, 'small'], [15, 'small'], [20, 'small']] as const)
        .map(([count, size]) => ({ type: 'leftright', count, size, style }))
    case 'dots':
      return ([[5, 'numbers', 'large'], [6, 'numbers', 'large'], [8, 'numbers', 'large'], [10, 'numbers', 'medium'], [6, 'letters', 'large'], [8, 'letters', 'large'],
        [10, 'letters', 'medium'], [12, 'numbers', 'medium'], [8, 'alternating', 'large'], [10, 'alternating', 'medium'], [14, 'alternating', 'small']] as const)
        .map(([count, mode, size]) => ({ type: 'dots', count, mode, size }))
    case 'findletter':
      return ([[5, 'three'], [8, 'three'], [10, 'three'], [5, 'alphabet'], [8, 'alphabet'], [10, 'alphabet'], [5, 'keyboard'], [8, 'keyboard'], [12, 'keyboard'], [15, 'keyboard']] as const)
        .map(([count, board]) => ({ type: 'findletter', count, board }))
    case 'numbergrid':
      return ([[3, 'numbers'], [3, 'letters'], [4, 'numbers'], [4, 'letters'], [5, 'numbers'], [5, 'letters']] as const)
        .map(([grid, mode]) => ({ type: 'numbergrid', grid, mode }))
    case 'oddone':
      return [[3, 3], [4, 4], [4, 5], [5, 5], [5, 6], [6, 6], [7, 6], [8, 8]].map(([grid, rounds]) => ({ type: 'oddone', grid, rounds, style }))
    case 'cups':
      return ([[3, 2, 'slow'], [3, 3, 'slow'], [3, 4, 'slow'], [3, 5, 'medium'], [4, 4, 'medium'], [4, 6, 'medium'], [4, 8, 'medium'], [5, 6, 'medium'], [5, 8, 'fast'], [5, 12, 'fast']] as const)
        .map(([cups, swaps, speed]) => ({ type: 'cups', cups, swaps, speed, rounds: 3, style }))
    case 'findall':
      return [[4, 3], [5, 4], [5, 5], [6, 5], [6, 6], [7, 7], [8, 8], [9, 10], [10, 12]].map(([grid, targets]) => ({ type: 'findall', grid, targets, style }))
    case 'pattern':
      return [[3, 2], [3, 3], [3, 4], [4, 3], [4, 4], [4, 5], [5, 4], [5, 5], [5, 6], [5, 7]].map(([grid, squares]) => ({ type: 'pattern', grid, squares, rounds: 3 }))
    case 'spotdiff':
      return [3, 3, 4, 4, 5, 5, 6].map((grid, i) => ({ type: 'spotdiff', grid, rounds: i < 2 ? 3 : 4, style }))
    case 'puzzle': {
      // Every picture from every set, one per level: 4 pieces, then 9.
      const pics = PUZZLE_SETS.flatMap(s => s.emoji)
      return pics.map((e, i) => ({ type: 'puzzle', ghost: true, levels: [{ grid: grown || i >= 5 ? 3 : 2, scene: simpleScene(e, i) }] }))
    }
    case 'match':
      // A new picture set each level, growing from 3 to 5 pairs.
      return [3, 4, 5].flatMap(n => MATCH_SETS.map(set => ({ type: 'match' as const, pairs: set.pairs.slice(0, n) })))
    case 'dressup':
      // Right clothes only first, then 1, 2 and 3 that don't fit the scene.
      return ([['snow', 0], ['summer', 0], ['rain', 1], ['picnic', 1], ['party', 1], ['beach', 2], ['sports', 2], ['school', 2], ['fall', 3],
        ['snow', 3], ['summer', 3], ['rain', 3]] as const).map(([scenario, distractors]) => ({ type: 'dressup', scenario, distractors }))
    default:
      return []
  }
}
