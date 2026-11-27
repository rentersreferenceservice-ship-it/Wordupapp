// At-home activities that build the motor planning used to point to letters,
// using everyday chores and play. Grouped torso → finger like the exercises
// (lib/motorPlanning.ts). Families can print a sheet of chosen activities.

export type HomeGroup = 'torso' | 'arm' | 'wrist' | 'finger'

export interface HomeActivity {
  id: string
  group: HomeGroup
  emoji: string
  name: string
  builds: string
  steps: string[]
  easier: string
  harder: string
  position: 'Seated' | 'Standing' | 'Seated or standing'
}

export const HOME_GROUPS: { key: HomeGroup; label: string }[] = [
  { key: 'torso', label: 'Torso & Shoulder' },
  { key: 'arm', label: 'Arm & Reach' },
  { key: 'wrist', label: 'Wrist' },
  { key: 'finger', label: 'Hand & Pointer Finger' },
]

export const HOME_ACTIVITIES: HomeActivity[] = [
  // ── Torso & Shoulder ───────────────────────────────────────────────────
  { id: 'windows', group: 'torso', emoji: '🪟', name: 'Window or Mirror Washing', position: 'Standing', builds: 'Shoulder stability and crossing the middle of the body',
    steps: ['Spray the glass, then wipe with a cloth in big circles.', 'Circle both directions, then do long side-to-side sweeps.'], easier: 'Small window, a dry cloth, one direction.', harder: 'A big mirror or sliding door; reach high and low.' },
  { id: 'wipetable', group: 'torso', emoji: '🧽', name: 'Wiping the Table', position: 'Seated or standing', builds: 'Crossing the middle and steady pressure',
    steps: ['Start on one side of the table.', 'Wipe in long sweeps all the way across to the other side.'], easier: 'A small part of the table.', harder: 'The whole table, pressing firmly the whole way.' },
  { id: 'knead', group: 'torso', emoji: '🍞', name: 'Kneading Dough or Clay', position: 'Seated or standing', builds: 'Upper-body strength and pushing with control',
    steps: ['Push the dough away with the heels of both hands.', 'Fold it back, turn it, and push again.'], easier: 'Soft play dough.', harder: 'Real bread dough or stiff clay.' },
  { id: 'laundrycarry', group: 'torso', emoji: '🧺', name: 'Carrying the Laundry Basket', position: 'Standing', builds: 'Heavy work that calms and organizes the body',
    steps: ['Hold the basket with both hands close to the body.', 'Carry it to another room and set it down gently.'], easier: 'A few light towels.', harder: 'A fuller basket, or up a few stairs with help.' },
  { id: 'sweep', group: 'torso', emoji: '🧹', name: 'Sweeping or Vacuuming', position: 'Standing', builds: 'Two-handed pushing and trunk control',
    steps: ['Hold the broom or vacuum with both hands.', 'Push in long, steady strokes, then pull back.'], easier: 'A small area or a dustpan and brush.', harder: 'A whole room, getting into the corners.' },
  { id: 'waterpaint', group: 'torso', emoji: '🖌️', name: 'Painting with Water', position: 'Standing', builds: 'Big arm movements and shoulder stability',
    steps: ['Outside, dip a big paintbrush in a bucket of water.', '"Paint" a fence, wall, or sidewalk with big strokes.'], easier: 'Short strokes at waist height.', harder: 'Reach high over the head and across the body.' },
  { id: 'counterpush', group: 'torso', emoji: '💪', name: 'Kitchen Counter Push-Ups', position: 'Standing', builds: 'Shoulder strength and body awareness',
    steps: ['Put both hands on the edge of the counter, feet stepped back.', 'Bend your elbows to lean in, then push back.'], easier: 'Stand closer to the counter.', harder: 'Step feet farther back; do 10.' },
  { id: 'makebed', group: 'torso', emoji: '🛏️', name: 'Making the Bed', position: 'Standing', builds: 'Reaching, pulling, and two hands working together',
    steps: ['Pull the sheet and blanket up to the pillow.', 'Smooth them flat with both hands.'], easier: 'Just pull up the blanket.', harder: 'Tuck in corners and fluff the pillows.' },
  { id: 'rake', group: 'torso', emoji: '🍂', name: 'Raking Leaves', position: 'Standing', builds: 'Trunk rotation and pulling with both arms',
    steps: ['Hold the rake with both hands.', 'Pull the leaves toward you into a pile.'], easier: 'A small patch of leaves.', harder: 'Rake into a bag or basket.' },

  // ── Arm & Reach ────────────────────────────────────────────────────────
  { id: 'dishesaway', group: 'arm', emoji: '🍽️', name: 'Putting Dishes Away', position: 'Standing', builds: 'Controlled reaching up and out to the side',
    steps: ['Hand over one plastic plate or cup at a time.', 'Reach up or to the side to place it on the shelf.'], easier: 'Low shelves, plastic dishes.', harder: 'Higher shelves; stack them neatly.' },
  { id: 'clothespins', group: 'arm', emoji: '👕', name: 'Hanging Laundry with Clothespins', position: 'Standing', builds: 'Reaching plus a pinch at the end',
    steps: ['Reach up to the line or drying rack.', 'Pinch the clothespin open and clip on a sock or washcloth.'], easier: 'Large, easy-to-squeeze clips.', harder: 'Small clothespins on a higher line.' },
  { id: 'wateringcan', group: 'arm', emoji: '🪴', name: 'Watering Plants', position: 'Standing', builds: 'Holding the arm steady while aiming',
    steps: ['Hold the watering can by the handle.', 'Aim and pour slowly onto the soil, not the leaves.'], easier: 'A little water in a small can.', harder: 'A fuller can; water several plants.' },
  { id: 'washcar', group: 'arm', emoji: '🚗', name: 'Washing the Car or Bike', position: 'Standing', builds: 'Big reaches and steady pressure',
    steps: ['Dip a big sponge in soapy water.', 'Scrub in circles — up high, down low, and across.'], easier: 'Just the wheels or a bike.', harder: 'The whole side of the car.' },
  { id: 'stackcans', group: 'arm', emoji: '🥫', name: 'Stacking Cans on a Shelf', position: 'Seated or standing', builds: 'Reaching with control and placing gently',
    steps: ['Pick up one can at a time.', 'Reach and set it on the shelf, then build a row or tower.'], easier: 'Light boxes or plastic containers.', harder: 'Taller stacks or a higher shelf.' },
  { id: 'laundrytoss', group: 'arm', emoji: '🧦', name: 'Sock Toss into the Basket', position: 'Seated or standing', builds: 'Aiming the arm at a target',
    steps: ['Roll socks into balls.', 'Toss them into the laundry basket.'], easier: 'Basket close by.', harder: 'Move the basket farther, or off to the side.' },
  { id: 'fridgewipe', group: 'arm', emoji: '🧊', name: 'Wiping Cabinets and the Fridge Door', position: 'Standing', builds: 'Reaching high, low, and side to side',
    steps: ['Wipe from the top of the door down to the bottom.', 'Then side to side across it.'], easier: 'One small cabinet door.', harder: 'The whole fridge, reaching up high.' },

  // ── Wrist ──────────────────────────────────────────────────────────────
  { id: 'stir', group: 'wrist', emoji: '🥣', name: 'Stirring', position: 'Seated', builds: 'Wrist control against resistance',
    steps: ['Hold the bowl with one hand and the spoon with the other.', 'Stir in circles — then switch directions.'], easier: 'Thin pancake batter or water.', harder: 'Thick cookie dough or brownie batter.' },
  { id: 'pour', group: 'wrist', emoji: '🥛', name: 'Pouring Between Cups', position: 'Seated', builds: 'A slow, steady wrist turn',
    steps: ['Fill one cup partway with water or dry rice.', 'Pour it slowly into the other cup without spilling.'], easier: 'Dry rice and wide cups.', harder: 'Water into a narrow cup or a small pitcher.' },
  { id: 'jars', group: 'wrist', emoji: '🫙', name: 'Opening Jars and Twisting Lids', position: 'Seated', builds: 'Twisting with both hands working together',
    steps: ['Hold the jar steady with one hand.', 'Twist the lid open with the other, then close it.'], easier: 'Loose lids on plastic containers.', harder: 'Tighter lids or water bottle caps.' },
  { id: 'doorknob', group: 'wrist', emoji: '🚪', name: 'Turning Doorknobs and Keys', position: 'Standing', builds: 'Wrist rotation',
    steps: ['Turn the knob all the way to open the door.', 'Practice turning a key in a lock with help.'], easier: 'Lever-style handles.', harder: 'Round knobs and keys.' },
  { id: 'wring', group: 'wrist', emoji: '🧻', name: 'Wringing Out a Washcloth', position: 'Standing', builds: 'Wrist strength and both hands working together',
    steps: ['Soak a washcloth in water.', 'Twist it with both hands in opposite directions to squeeze the water out.'], easier: 'A small, thin cloth.', harder: 'A thick towel.' },
  { id: 'whisk', group: 'wrist', emoji: '🥚', name: 'Whisking Eggs', position: 'Seated', builds: 'Quick, controlled wrist movement',
    steps: ['Hold the bowl steady.', 'Whisk in small circles until the eggs are mixed.'], easier: 'Use a fork and go slowly.', harder: 'Whisk cream until it thickens.' },
  { id: 'brushpaint', group: 'wrist', emoji: '🎨', name: 'Painting a Picture', position: 'Seated', builds: 'Small wrist movements with a tool',
    steps: ['Hold a paintbrush like a pencil.', 'Paint lines, circles, and dots.'], easier: 'A fat brush and big paper.', harder: 'A thin brush and small details.' },

  // ── Hand & Pointer Finger ──────────────────────────────────────────────
  { id: 'buttons', group: 'finger', emoji: '🔘', name: 'Pressing Buttons with One Finger', position: 'Seated or standing', builds: 'An isolated pointer finger — just like poking letters',
    steps: ['Make a pointer finger.', 'Press the microwave, elevator, TV remote, or calculator buttons.'], easier: 'Big buttons like the elevator.', harder: 'Small calculator or phone keypad buttons.' },
  { id: 'bubblewrap', group: 'finger', emoji: '🫧', name: 'Popping Bubble Wrap', position: 'Seated', builds: 'Pointer finger strength and aim',
    steps: ['Lay bubble wrap flat on the table.', 'Pop one bubble at a time with just the pointer finger.'], easier: 'Big bubbles.', harder: 'Small bubbles, going in rows.' },
  { id: 'coins', group: 'finger', emoji: '🐷', name: 'Coins into a Piggy Bank', position: 'Seated', builds: 'A precise poke into a small target',
    steps: ['Pick up one coin.', 'Line it up and push it into the slot.'], easier: 'Big coins and a wide slot.', harder: 'Dimes, or a narrow slot.' },
  { id: 'spraybottle', group: 'finger', emoji: '💦', name: 'Squeezing a Spray Bottle', position: 'Seated or standing', builds: 'Finger strength',
    steps: ['Fill a spray bottle with water.', 'Squeeze to water plants or "clean" a window.'], easier: 'A light, easy trigger.', harder: 'Spray a target, like drawings on the sidewalk.' },
  { id: 'tongs', group: 'finger', emoji: '🥢', name: 'Picking Up Snacks with Tongs', position: 'Seated', builds: 'Hand control and squeeze-and-release',
    steps: ['Squeeze the tongs to grab a snack.', 'Move it to a plate and let go.'], easier: 'Big tongs and big snacks.', harder: 'Small tongs or tweezers and cereal pieces.' },
  { id: 'lettuce', group: 'finger', emoji: '🥬', name: 'Tearing Lettuce and Pulling Grapes', position: 'Seated', builds: 'Finger strength and both hands working together',
    steps: ['Tear lettuce into small pieces for a salad.', 'Pull grapes off the stem one at a time.'], easier: 'Soft lettuce leaves.', harder: 'Shelling peas or pulling herbs off stems.' },
  { id: 'stickers', group: 'finger', emoji: '⭐', name: 'Peeling and Placing Stickers', position: 'Seated', builds: 'A pinch and an exact placement',
    steps: ['Peel a sticker off the sheet.', 'Place it on a target, like a dot or a box.'], easier: 'Big stickers, anywhere on the page.', harder: 'Small stickers on exact spots.' },
  { id: 'sprinkles', group: 'finger', emoji: '🍪', name: 'Decorating Cookies', position: 'Seated', builds: 'Fine finger placement',
    steps: ['Pinch sprinkles or chocolate chips.', 'Place them one at a time on the cookie.'], easier: 'Big candies.', harder: 'Tiny sprinkles in a pattern.' },
  { id: 'doughpoke', group: 'finger', emoji: '👉', name: 'Poking Holes in Play Dough', position: 'Seated', builds: 'An isolated pointer finger with resistance',
    steps: ['Flatten play dough into a pancake.', 'Poke holes all over it with just the pointer finger.'], easier: 'Soft dough.', harder: 'Stiff dough, or poke holes in a line or pattern.' },
  { id: 'keypad', group: 'finger', emoji: '📱', name: 'Dialing on a Keypad', position: 'Seated', builds: 'Pointing to small targets in order — close to spelling',
    steps: ['Say or show a number.', 'Press each digit on a phone or calculator keypad.'], easier: 'One digit at a time.', harder: 'A whole phone number from memory.' },
  { id: 'eggcarton', group: 'finger', emoji: '🥚', name: 'Sorting into an Egg Carton', position: 'Seated', builds: 'Pinching and placing in small spaces',
    steps: ['Pinch one small item (pompom, bead, button).', 'Drop it into a cup of the egg carton.'], easier: 'Big pompoms.', harder: 'Small beads, sorted by color.' },
  { id: 'peas', group: 'finger', emoji: '🫛', name: 'Opening Pea Pods', position: 'Seated', builds: 'Finger strength and coordination',
    steps: ['Press the seam of the pod with your thumb to open it.', 'Push the peas out one at a time.'], easier: 'Snap peas, opened halfway.', harder: 'Small pods, peas into a bowl.' },
]
