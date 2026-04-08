export default function BackgroundText() {
  const content = [
    { color: 'rgba(21,128,61,0.55)', text: 'What is the telescope that looks at space called? When did the James Webb Telescope launch into space? What does the MIRROR collect from far away stars and galaxies?' },
    { color: 'rgba(0,0,0,0.32)', text: 'THE JAMES WEBB SPACE TELESCOPE / JWST · DECEMBER 25, 2021 / CHRISTMAS DAY · LIGHT FROM BILLIONS OF YEARS AGO ·' },
    { color: 'rgba(234,88,12,0.55)', text: 'Name something the text tells us the telescope can look at. Name two things the text says about the mirror. What keeps the telescope steady in space at the Lagrange Point?' },
    { color: 'rgba(0,0,0,0.32)', text: 'STARS / PLANETS / GALAXIES / DISTANT LIGHT · MADE OF 18 PIECES / MADE OF GOLD AND BERYLLIUM · GRAVITY FROM EARTH AND THE SUN ·' },
    { color: 'rgba(126,34,206,0.55)', text: 'How many miles from Earth is the Lagrange Point? How many pieces make up the James Webb Telescope mirror? How many planets orbit in our solar system?' },
    { color: 'rgba(0,0,0,0.32)', text: 'ONE MILLION MILES · 18 PIECES · 8 PLANETS ·' },
    { color: 'rgba(220,38,38,0.55)', text: 'Close your eyes and imagine floating one million miles from Earth. What do you see all around you? Imagine you are a leaf soaking up warm sunlight all day long. What does it feel like in your body?' },
    { color: 'rgba(0,0,0,0.32)', text: 'STARS / DARKNESS / EARTH FROM FAR AWAY / THE SUN / GALAXIES · WARM / BRIGHT / ALIVE / ENERGIZED / PEACEFUL ·' },
    { color: 'rgba(219,39,119,0.55)', text: 'If you could explore any part of space where would you go and why? What does freedom mean to you personally? What would you most want to say if you had a letterboard right now today?' },
    { color: 'rgba(0,0,0,0.32)', text: 'STUDENT CHOICE · STUDENT CHOICE · STUDENT CHOICE ·' },
    { color: 'rgba(37,99,235,0.55)', text: 'What planet do humans live on? What country declared independence in 1776? What gas do plants release during photosynthesis? What is at the very center of our solar system?' },
    { color: 'rgba(0,0,0,0.32)', text: 'EARTH · THE UNITED STATES OF AMERICA · OXYGEN · THE SUN ·' },
    { color: 'rgba(21,128,61,0.55)', text: 'What process do plants use to make their own food? What tool is used in Spelling to Communicate? What does the topic sentence tell the reader at the start of a paragraph?' },
    { color: 'rgba(0,0,0,0.32)', text: 'PHOTOSYNTHESIS · A LETTERBOARD · WHAT THE PARAGRAPH WILL BE ABOUT ·' },
    { color: 'rgba(234,88,12,0.55)', text: 'Name two things plants need for photosynthesis. Name two things LITERACY helps a person do every day. Name two emotions humans can feel throughout their lives.' },
    { color: 'rgba(0,0,0,0.32)', text: 'SUNLIGHT / WATER / CARBON DIOXIDE · READ / WRITE / COMMUNICATE / LEARN · JOY / SADNESS / ANGER / FEAR / HAPPINESS ·' },
    { color: 'rgba(126,34,206,0.55)', text: 'How many original colonies became the United States of America? How many letters are in the English alphabet? How many basic emotions do most scientists agree humans have?' },
    { color: 'rgba(0,0,0,0.32)', text: '13 COLONIES · 26 LETTERS · 6 BASIC EMOTIONS ·' },
    { color: 'rgba(220,38,38,0.55)', text: 'Think of a happy moment in your life. What do you feel in your body right now? Imagine spelling your very first full sentence on a letterboard. What do you feel deep inside your heart?' },
    { color: 'rgba(0,0,0,0.32)', text: 'WARMTH / JOY / SMILING / ENERGY / LIGHTNESS · PROUD / EXCITED / HAPPY / RELIEVED / POWERFUL ·' },
    { color: 'rgba(219,39,119,0.55)', text: 'What emotion do you feel most often and why? What does communication mean to you personally? If you were a plant where in the world would you want to grow?' },
    { color: 'rgba(0,0,0,0.32)', text: 'STUDENT CHOICE · STUDENT CHOICE · STUDENT CHOICE ·' },
    { color: 'rgba(37,99,235,0.55)', text: 'What part of the body processes language every day? Which planet is the only one known to support life? What document told the world that Americans wanted to be free and self-governing?' },
    { color: 'rgba(0,0,0,0.32)', text: 'THE BRAIN · EARTH · THE DECLARATION OF INDEPENDENCE ·' },
    { color: 'rgba(21,128,61,0.55)', text: 'What are emotions and why do they matter? What does literacy mean for a person? What is a paragraph? What does the Artemis Mission plan to do for space exploration?' },
    { color: 'rgba(0,0,0,0.32)', text: 'FEELINGS WE EXPERIENCE EVERY DAY · THE ABILITY TO READ WRITE AND COMMUNICATE · A GROUP OF SENTENCES ABOUT ONE IDEA · SEND ASTRONAUTS TO THE MOON ·' },
    { color: 'rgba(234,88,12,0.55)', text: 'Name two things Spelling to Communicate gives a person. Name two things the colonists wanted from the American Revolution. Name two facts the text tells us about the Artemis Mission.' },
    { color: 'rgba(0,0,0,0.32)', text: 'A VOICE / ABILITY TO SHARE INTELLIGENCE · FREEDOM / INDEPENDENCE / RIGHTS · NASA RUNS IT / ASTRONAUTS WILL GO TO THE MOON ·' },
    { color: 'rgba(126,34,206,0.55)', text: 'How many senses does the human body have? How many years ago did dinosaurs go extinct on Earth? How many bones are in the adult human body? How many colors appear in a rainbow?' },
    { color: 'rgba(0,0,0,0.32)', text: '5 SENSES · 66 MILLION YEARS AGO · 206 BONES · 7 COLORS ·' },
    { color: 'rgba(220,38,38,0.55)', text: 'Imagine standing on Mars and looking back at Earth from far away. What do you see and feel all around you? Close your eyes and imagine spelling your name for the very first time on a letterboard.' },
    { color: 'rgba(0,0,0,0.32)', text: 'A TINY BLUE DOT / WONDER / AWE / AMAZEMENT · PROUD / EXCITED / SEEN / HEARD / POWERFUL ·' },
    { color: 'rgba(219,39,119,0.55)', text: 'If you could send one message to the entire world using a letterboard what would it say? What is your favorite topic to learn about and why would you want a lesson written about it?' },
    { color: 'rgba(0,0,0,0.32)', text: 'STUDENT CHOICE · STUDENT CHOICE ·' },
    { color: 'rgba(37,99,235,0.55)', text: 'What is the job of the topic sentence in a paragraph? What keeps the James Webb Telescope steady at L2? What is the green part of a plant that captures sunlight for energy called?' },
    { color: 'rgba(0,0,0,0.32)', text: 'TO TELL THE READER WHAT THE PARAGRAPH IS ABOUT · GRAVITY FROM EARTH AND THE SUN · CHLOROPHYLL ·' },
    { color: 'rgba(21,128,61,0.55)', text: 'What does a speller do on the letterboard to communicate? What is photosynthesis and why does it matter to all living things? What was the name of the army that George Washington led during the revolution?' },
    { color: 'rgba(0,0,0,0.32)', text: 'POINTS TO LETTERS TO BUILD WORDS AND SENTENCES · HOW PLANTS MAKE FOOD · THE CONTINENTAL ARMY ·' },
  ]

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none select-none print:hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <p
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '17px',
          lineHeight: '1.35',
          margin: 0,
          padding: '4px 0',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
        }}
      >
        {content.map((segment, i) => (
          <span key={i} style={{ color: segment.color, fontWeight: segment.color.includes('0,0,0') ? 'bold' : 'bold' }}>
            {segment.text}{' '}
          </span>
        ))}
      </p>
    </div>
  )
}
