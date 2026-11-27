// Motor Planning Exercises — upper-body work for pointing to letters.
// Ordered proximal to distal (torso → shoulder → arm → wrist → finger):
// a steady torso and stable shoulder let the arm reach with control, so the
// wrist stays steady and the index finger can point on its own.
// Demo videos were picked and checked once (lib/youtubePicker.ts) and are
// stored here so every speller sees the same clip.

export type MotorGroup = 'torso' | 'shoulder' | 'arm' | 'wrist' | 'finger'

export interface MotorExercise {
  id: string
  group: MotorGroup
  emoji: string
  name: string
  steps: string[]
  reps: string
  seated: boolean
  /** Seconds to hold — shows an optional "Count with me" helper. */
  holdSeconds?: number
  videoId?: string
  videoTitle?: string
  /** Search used to find the demo video. */
  videoQuery: string
}

export const MOTOR_GROUPS: { key: MotorGroup; label: string; why: string }[] = [
  { key: 'torso', label: 'Torso', why: 'A steady base so the arm can move freely' },
  { key: 'shoulder', label: 'Shoulder', why: 'Stability for reaching to the board' },
  { key: 'arm', label: 'Arm & Elbow', why: 'The controlled reach of a poke' },
  { key: 'wrist', label: 'Wrist', why: 'A steady hand at the end of the reach' },
  { key: 'finger', label: 'Hand & Finger', why: 'An isolated index finger for pointing' },
]

export const MOTOR_EXERCISES: MotorExercise[] = [
  // Torso
  { id: 'sittall', group: 'torso', emoji: '🪑', name: 'Sit Tall Hold', seated: true, holdSeconds: 10, reps: 'Hold 10 seconds, 3 times',
    steps: ['Feet flat on the floor.', 'Sit up tall — like a string is pulling the top of your head up.', 'Hands resting on your legs. Hold still and breathe.'],
    videoId: 'XtIl182UQwU', videoTitle: "Two exercises for kids, to improve their posture",
    videoQuery: 'seated posture exercise for kids sit tall' },
  { id: 'trunkturns', group: 'torso', emoji: '🔄', name: 'Trunk Turns', seated: true, reps: '5 each side',
    steps: ['Sit tall with hands on your shoulders.', 'Slowly turn your upper body to the left, then back to the middle.', 'Now turn to the right. Keep your hips still.'],
    videoId: 'LBIv6xL0w08', videoTitle: "Seated Stretching:  Trunk Rotation",
    videoQuery: 'seated trunk rotation exercise' },
  { id: 'crossreach', group: 'torso', emoji: '↗️', name: 'Cross-Body Reach', seated: true, reps: '5 each side',
    steps: ['Partner holds a hand up at shoulder height, off to one side.', 'Reach across your body with the OPPOSITE hand to touch it.', 'Come back to the middle, then switch sides.'],
    videoId: 'Tu8FlsqwAoA', videoTitle: "Activities to Cross Midline",
    videoQuery: 'crossing midline reaching activity kids occupational therapy' },
  { id: 'chairpushup', group: 'torso', emoji: '💪', name: 'Chair Push-Up', seated: true, reps: '5 times',
    steps: ['Hands flat on the chair seat beside your hips.', 'Press down to lift your bottom a little off the seat.', 'Lower back down slowly.'],
    videoId: 'wdVX9U1y9I0', videoTitle: "Calming Activity 1 - Chair Push Ups",
    videoQuery: 'chair push ups for kids occupational therapy' },
  // Shoulder
  { id: 'tablepress', group: 'shoulder', emoji: '🖐️', name: 'Table Press', seated: true, holdSeconds: 5, reps: 'Press 5 seconds, 5 times',
    steps: ['Put both palms flat on the table.', 'Press down hard into the table — like you are trying to push it into the floor.', 'Hold, then relax.'],
    videoId: 'i9Oazd0XKMQ', videoTitle: "Classroom Heavy Work Hand Push Activity",
    videoQuery: 'table push heavy work exercise kids' },
  { id: 'shoulderrolls', group: 'shoulder', emoji: '🙆', name: 'Shoulder Rolls & Shrugs', seated: true, reps: '5 rolls each way, 5 shrugs',
    steps: ['Roll your shoulders slowly backward in a circle.', 'Now roll them forward.', 'Shrug your shoulders up to your ears, hold, and drop them down.'],
    videoId: 'YhhUjWz7N10', videoTitle: "Shoulder Roll Shrugs (forward/backward)",
    videoQuery: 'shoulder rolls shrugs exercise' },
  { id: 'armcircles', group: 'shoulder', emoji: '⭕', name: 'Arm Circles', seated: true, reps: '10 small, 10 big',
    steps: ['Hold both arms straight out to the sides.', 'Make small circles, then slowly make them bigger.', 'Switch direction.'],
    videoId: '4TJv9YmECjc', videoTitle: "How to Do: ARM CIRCLES",
    videoQuery: 'arm circles exercise for kids' },
  { id: 'reachtargets', group: 'shoulder', emoji: '🎯', name: 'Reach the Targets', seated: true, reps: '2 rounds',
    steps: ['Partner holds a hand up high, then low, then left, then right, then center — like spots on a letterboard.', 'Reach out and touch each one with your pointer finger.', 'Bring your hand back to your lap each time.'],
    videoId: 'lcpTNsWD8xQ', videoTitle: "Diagonal reaching",
    videoQuery: 'reaching targets activity occupational therapy upper extremity' },
  // Arm & elbow
  { id: 'punchouts', group: 'arm', emoji: '👊', name: 'Slow Punch-Outs', seated: true, reps: '5 each arm',
    steps: ['Make a soft fist at your chest.', 'Slowly push your arm straight out in front of you.', 'Slowly pull it back. Smooth and controlled, not fast.'],
    videoId: 'DqzoyszXVCk', videoTitle: "Standing Serratus Punch to Strengthen Your Shoulders & Improve Stability",
    videoQuery: 'slow controlled punches seated exercise' },
  { id: 'reachhold', group: 'arm', emoji: '🫴', name: 'Reach & Hold', seated: true, holdSeconds: 5, reps: 'Hold 5 seconds, 3 each arm',
    steps: ['Point your arm straight out toward a target (a partner’s hand or a sticker).', 'Keep it still — don’t let it drift down.', 'Hold, then rest.'],
    videoId: 'USiFuAdq8hY', videoTitle: "Exercise Arm Reach",
    videoQuery: 'arm reach and hold exercise kids' },
  { id: 'elbowbends', group: 'arm', emoji: '💪', name: 'Elbow Bend & Straighten', seated: true, reps: '10 each arm',
    steps: ['Start with your hand near your shoulder.', 'Slowly straighten your elbow — like moving toward the letterboard.', 'Slowly bend back. Keep it smooth.'],
    videoId: '9Bw8cd0iYYQ', videoTitle: "How To Do Elbow Range of Motion Exercise | 30 Seconds | MedBridge",
    videoQuery: 'elbow flexion extension exercise slow' },
  // Wrist
  { id: 'wristcircles', group: 'wrist', emoji: '🔃', name: 'Wrist Circles', seated: true, reps: '5 each way',
    steps: ['Hold your arm out in front of you.', 'Make slow circles with your hand at the wrist.', 'Switch direction.'],
    videoId: 'jwJbWXR_huM', videoTitle: "Wrist Circles",
    videoQuery: 'wrist circles exercise' },
  { id: 'wristupdown', group: 'wrist', emoji: '↕️', name: 'Wrist Up & Down', seated: true, reps: '10 times',
    steps: ['Arm out, palm facing down.', 'Lift your hand up at the wrist, then lower it down.', 'Keep your arm still — only the wrist moves.'],
    videoId: 'MYBrjpGMb-w', videoTitle: "Wrist flexion and extension exercise",
    videoQuery: 'wrist flexion extension exercise' },
  { id: 'tabletopwrist', group: 'wrist', emoji: '🤚', name: 'Tabletop Finger Lift', seated: true, reps: '5 times',
    steps: ['Rest your hand flat on the table.', 'Keep your wrist and palm down, and lift just your fingers.', 'Lower them slowly.'],
    videoId: 'jM_oOyNC0L4', videoTitle: "Exercise of the Week: Finger Lifts - Palmar Grasp Reflex",
    videoQuery: 'finger lifts on table exercise hand' },
  // Hand & finger
  { id: 'pointer', group: 'finger', emoji: '☝️', name: 'Make a Pointer', seated: true, holdSeconds: 5, reps: 'Hold 5 seconds, 5 times',
    steps: ['Fold your thumb, middle, ring and pinky fingers down.', 'Keep your pointer finger straight and tall.', 'Hold it — then switch hands.'],
    videoQuery: 'isolated index finger pointing exercise kids occupational therapy' },
  { id: 'fingertaps', group: 'finger', emoji: '🤌', name: 'Finger-Thumb Taps', seated: true, reps: '3 times through, each hand',
    steps: ['Touch your thumb to your pointer finger.', 'Then middle, ring, and pinky.', 'Go back the other way. Try it slowly, then a little faster.'],
    videoId: 'PiklLU6GezU', videoTitle: "Thumb to Finger Touch: Palmar Grasp, Hands Pullling, & Babkin Reflexes",
    videoQuery: 'finger opposition exercise thumb to finger kids' },
  { id: 'spiderwalk', group: 'finger', emoji: '🕷️', name: 'Spider Walk', seated: true, reps: 'Across the table and back',
    steps: ['Put your fingertips on the table.', 'Walk your fingers across the table like a spider.', 'Walk them back.'],
    videoQuery: 'finger walking spider fine motor activity' },
  { id: 'squeeze', group: 'finger', emoji: '✊', name: 'Squeeze & Release', seated: true, reps: '10 times',
    steps: ['Hold a stress ball or putty.', 'Squeeze it tight.', 'Now open your hand all the way and spread your fingers wide.'],
    videoId: 'BzLmV9Csd9Y', videoTitle: "How To: Stress Ball Squeezes for Hand and Grip Strength",
    videoQuery: 'squeeze ball hand strengthening kids' },
  { id: 'pokepractice', group: 'finger', emoji: '👉', name: 'Poke Practice', seated: true, reps: '10 pokes',
    steps: ['Make a pointer finger.', 'Poke putty, bubbles, or stickers — using just that finger.', 'Pull your hand back between pokes.'],
    videoId: 'Wg5kmNcE7Zg', videoTitle: "Fine Motor Activity_Play Dough Porcupine",
    videoQuery: 'poking play dough index finger fine motor' },
]

/** Pre-Session Warm-Up: one exercise from each group, torso to finger (~3–4 min). */
export const WARM_UP: string[] = ['sittall', 'tablepress', 'reachtargets', 'punchouts', 'wristcircles', 'pointer', 'fingertaps']
