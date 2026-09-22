import type { AgeGroupId } from './ageGroups';
import type { GuideIllustrationKey } from '../../components/guides/GuideIllustration';

export interface GuideActivity {
  id: string;
  title: string;
  ageGroups: AgeGroupId[];
  icon: GuideIllustrationKey;
  shortDescription: string;
  whatYouNeed: string[];
  howToDoIt: string[];
  developmentAreas: string[];
  safetyNote?: string;
  relatedGuideIds?: string[];
}

export const GUIDE_ACTIVITIES: GuideActivity[] = [
  // ---------------------------------------------------------------- 0–3 months
  {
    id: 'act-tummy-time',
    title: 'Tummy Time Basics',
    ageGroups: ['newborn'],
    icon: 'movement',
    shortDescription: 'Short, supervised time on the belly to build neck and shoulder strength.',
    whatYouNeed: ['A firm, flat surface (play mat or floor)', 'A few minutes when your baby is awake and content'],
    howToDoIt: [
      'Lay a small mat or blanket on the floor.',
      'Place your baby on their tummy for just 1–3 minutes at a time, a few times a day.',
      'Get down at eye level and talk or smile to keep them engaged.',
      'Stop if your baby gets fussy — short and frequent works better than long and forced.',
    ],
    developmentAreas: ['Motor skills', 'Neck & shoulder strength'],
    safetyNote: 'Only do tummy time while your baby is awake and supervised — always back to sleep for actual sleep.',
    relatedGuideIds: ['newborn-development'],
  },
  {
    id: 'act-face-talking',
    title: 'Face-to-Face Talking & Singing',
    ageGroups: ['newborn'],
    icon: 'music',
    shortDescription: 'Simple, close-up talking and singing that newborns are naturally drawn to.',
    whatYouNeed: ['Nothing but your voice and face'],
    howToDoIt: [
      'Hold your baby about 20–30cm from your face — right in their focus range.',
      'Talk in a warm, slightly sing-song voice, or hum a familiar tune.',
      'Pause and watch for a response — a look, a small sound — then respond back.',
      'Try slowly sticking out your tongue or opening your mouth wide; some newborns will attempt to copy you.',
    ],
    developmentAreas: ['Language', 'Social-emotional', 'Vision'],
    relatedGuideIds: ['newborn-development'],
  },
  {
    id: 'act-high-contrast',
    title: 'High-Contrast Visual Play',
    ageGroups: ['newborn'],
    icon: 'sensory',
    shortDescription: 'Simple black-and-white patterns that are easy for young eyes to focus on.',
    whatYouNeed: ['High-contrast cards, a book, or simple bold patterns (even a striped shirt works)'],
    howToDoIt: [
      'Hold a high-contrast image about 20–30cm from your baby\'s face.',
      'Move it slowly side to side and see if their eyes track it.',
      'Keep sessions short — a minute or two is plenty at this age.',
      'Switch images every so often to keep things interesting.',
    ],
    developmentAreas: ['Vision', 'Attention'],
    relatedGuideIds: ['newborn-development'],
  },

  // ---------------------------------------------------------------- 3–6 months
  {
    id: 'act-reach-grasp',
    title: 'Reaching and Grasping Play',
    ageGroups: ['infant3to6'],
    icon: 'movement',
    shortDescription: 'Encouraging your baby to reach for and grab safe, easy-to-hold toys.',
    whatYouNeed: ['A lightweight rattle or ring toy', 'A safe, supervised spot to lie or sit supported'],
    howToDoIt: [
      'Hold a toy just within reach, slightly to one side.',
      'Give your baby time to notice it and reach — resist the urge to place it straight into their hand.',
      'Let them grasp, mouth, and explore it once they get it.',
      'Repeat from a few different angles to encourage reaching across the middle of their body.',
    ],
    developmentAreas: ['Fine motor skills', 'Hand-eye coordination'],
    safetyNote: 'Use toys too large to be a choking hazard, and always supervise.',
    relatedGuideIds: ['infant3to6-development', 'infant3to6-play'],
  },
  {
    id: 'act-mirror-play',
    title: 'Mirror Play',
    ageGroups: ['infant3to6'],
    icon: 'social',
    shortDescription: 'A simple, engaging way for babies to start noticing faces and expressions — including their own.',
    whatYouNeed: ['A baby-safe mirror (unbreakable)'],
    howToDoIt: [
      'Sit with your baby facing a baby-safe mirror, supported on your lap or propped safely.',
      'Point to the reflection and say your baby\'s name, then your own.',
      'Make a few different expressions and see if your baby reacts.',
      'Keep it playful and brief — a few minutes is enough at this age.',
    ],
    developmentAreas: ['Social-emotional', 'Vision', 'Self-awareness'],
    relatedGuideIds: ['infant3to6-play', 'infant3to6-development'],
  },
  {
    id: 'act-textured-sensory',
    title: 'Textured Sensory Play',
    ageGroups: ['infant3to6'],
    icon: 'sensory',
    shortDescription: 'Exploring different safe textures with hands and (carefully) mouths.',
    whatYouNeed: ['A few safe household items with different textures (soft fabric, a smooth wooden spoon, crinkly baby-safe paper)'],
    howToDoIt: [
      'Lay your baby on their back or sit them supported, and offer one item at a time.',
      'Let them touch, hold, and mouth it under close supervision.',
      'Name the texture out loud ("soft," "smooth," "crinkly") as they explore.',
      'Rotate items every minute or two to keep their interest.',
    ],
    developmentAreas: ['Sensory processing', 'Fine motor skills'],
    safetyNote: 'Only use items too large to swallow, with no small parts, and supervise closely since everything goes to the mouth at this age.',
    relatedGuideIds: ['infant3to6-play'],
  },

  // ---------------------------------------------------------------- 6–9 months
  {
    id: 'act-floor-play',
    title: 'Sitting-Up Floor Play',
    ageGroups: ['infant6to9'],
    icon: 'movement',
    shortDescription: 'Open floor time that encourages sitting balance and reaching in every direction.',
    whatYouNeed: ['A safe, cleared floor space', 'A couple of toys placed just out of reach'],
    howToDoIt: [
      'Sit your baby on a soft mat, supported by cushions at first if needed.',
      'Place a toy slightly to one side so they have to reach and twist to get it.',
      'Encourage them to reach in different directions as their balance improves.',
      'Stay close in case they topple — this stage involves a lot of practice falls.',
    ],
    developmentAreas: ['Gross motor skills', 'Balance'],
    safetyNote: 'Keep the area free of hard edges nearby in case of a fall.',
    relatedGuideIds: ['infant6to9-development'],
  },
  {
    id: 'act-object-basket',
    title: 'Object Exploration Basket',
    ageGroups: ['infant6to9'],
    icon: 'exploration',
    shortDescription: 'A simple basket of safe household objects for open-ended exploring.',
    whatYouNeed: ['A small basket or box', 'A handful of safe, large household items (a wooden spoon, a small soft ball, a fabric scrap)'],
    howToDoIt: [
      'Gather a few safe items your baby doesn\'t usually play with — novelty holds attention well at this age.',
      'Let your baby pull items out of the basket one at a time.',
      'Narrate what they pick up and what it does.',
      'Let them lead — this works best as open exploration, not a directed activity.',
    ],
    developmentAreas: ['Sensory processing', 'Fine motor skills', 'Cause and effect'],
    safetyNote: 'Every item must be too large to be a choking hazard, with no small or breakable parts — supervise closely.',
    relatedGuideIds: ['infant6to9-development'],
  },
  {
    id: 'act-peekaboo',
    title: 'Peekaboo and Simple Games',
    ageGroups: ['infant6to9'],
    icon: 'social',
    shortDescription: 'A timeless game that supports understanding that things (and people) still exist when hidden.',
    whatYouNeed: ['Just your hands, or a light muslin cloth'],
    howToDoIt: [
      'Cover your face with your hands or a cloth, then say "where\'s Mommy/Daddy?"',
      'Reveal yourself with a cheerful "peekaboo!"',
      'Watch for anticipation building over a few rounds — a big part of the fun for your baby.',
      'Try hiding a toy under a cloth and helping your baby find it, as a variation.',
    ],
    developmentAreas: ['Object permanence', 'Social-emotional', 'Language'],
    relatedGuideIds: ['infant6to9-parenting-anxiety'],
  },

  // ---------------------------------------------------------------- 9–12 months
  {
    id: 'act-cruising-play',
    title: 'Cruising and Pull-to-Stand Play',
    ageGroups: ['infant9to12'],
    icon: 'movement',
    shortDescription: 'Setting up safe, sturdy spots for your baby to practice standing and side-stepping.',
    whatYouNeed: ['A sturdy, low, stable piece of furniture (secured against tipping)'],
    howToDoIt: [
      'Sit or kneel near a stable, low piece of furniture your baby likes to pull up on.',
      'Place an interesting toy along the furniture, slightly to the side, to encourage side-stepping toward it.',
      'Cheer and encourage each attempt, wobbly or not.',
      'Stay within arm\'s reach — this stage involves a lot of practice falls onto a padded bottom.',
    ],
    developmentAreas: ['Gross motor skills', 'Balance', 'Confidence'],
    safetyNote: 'Only use furniture that\'s secured and won\'t tip, and clear the area of sharp corners.',
    relatedGuideIds: ['infant9to12-development'],
  },
  {
    id: 'act-stack-nest',
    title: 'Stacking and Nesting Play',
    ageGroups: ['infant9to12'],
    icon: 'exploration',
    shortDescription: 'Simple stacking cups or blocks that build early problem-solving.',
    whatYouNeed: ['Stacking cups, soft blocks, or nesting bowls'],
    howToDoIt: [
      'Sit with your baby and demonstrate stacking two items, then knock them down together — the knocking down is often the favorite part.',
      'Let your baby try placing items themselves, offering help only when they get frustrated.',
      'Try nesting cups inside each other as a variation once stacking is familiar.',
      'Celebrate any attempt, not just a successful stack.',
    ],
    developmentAreas: ['Problem-solving', 'Fine motor skills', 'Cause and effect'],
    relatedGuideIds: ['infant9to12-play'],
  },
  {
    id: 'act-reading-together',
    title: 'Reading Together',
    ageGroups: ['infant9to12'],
    icon: 'reading',
    shortDescription: 'Short, interactive book time that builds early language and connection.',
    whatYouNeed: ['A couple of sturdy board books'],
    howToDoIt: [
      'Sit your baby on your lap facing the book, or beside you.',
      'Point to pictures and name them, rather than necessarily reading every word.',
      'Let your baby turn pages, chew the corners, or lose interest early — that\'s all normal.',
      'Keep sessions short and frequent rather than long and rare.',
    ],
    developmentAreas: ['Language', 'Attention', 'Social-emotional'],
    relatedGuideIds: ['infant9to12-play'],
  },

  // ---------------------------------------------------------------- 12–18 months
  {
    id: 'act-obstacle-course',
    title: 'Simple Obstacle Course',
    ageGroups: ['toddler12to18'],
    icon: 'movement',
    shortDescription: 'A mini indoor obstacle course using cushions and furniture for climbing practice.',
    whatYouNeed: ['A few soft cushions', 'A safe, cleared space'],
    howToDoIt: [
      'Arrange cushions as small "hills" to climb over, and a clear path to walk through.',
      'Show your toddler the course once, then let them explore at their own pace.',
      'Stay close for balance support, especially near any step-like cushion.',
      'Change the layout occasionally to keep it interesting.',
    ],
    developmentAreas: ['Gross motor skills', 'Balance', 'Confidence'],
    safetyNote: 'Keep the course low and soft, away from hard furniture edges, and supervise the whole time.',
    relatedGuideIds: ['toddler12to18-development'],
  },
  {
    id: 'act-music-movement',
    title: 'Music and Movement Play',
    ageGroups: ['toddler12to18'],
    icon: 'music',
    shortDescription: 'Simple songs paired with movement to build coordination and rhythm.',
    whatYouNeed: ['A favorite song or two, played or sung'],
    howToDoIt: [
      'Put on a simple, familiar song, or sing one yourself.',
      'Model easy movements — clapping, swaying, stomping — and invite your toddler to copy.',
      'Follow their lead if they invent their own moves.',
      'Keep it short and silly; a couple of songs is a full session at this age.',
    ],
    developmentAreas: ['Gross motor skills', 'Rhythm', 'Language'],
    relatedGuideIds: ['toddler12to18-development'],
  },
  {
    id: 'act-pretend-play-basics',
    title: 'Pretend Play Basics',
    ageGroups: ['toddler12to18'],
    icon: 'social',
    shortDescription: 'Simple pretend scenarios like feeding a stuffed animal or "talking" on a toy phone.',
    whatYouNeed: ['A stuffed animal or doll, or a toy phone (a real everyday object works too)'],
    howToDoIt: [
      'Model a simple pretend action, like "feeding" a stuffed animal with a spoon.',
      'Invite your toddler to try, and follow whatever direction they take it.',
      'Keep the scenario simple and short at this early pretend-play stage.',
      'Praise the imagination, not just "correct" play.',
    ],
    developmentAreas: ['Imagination', 'Language', 'Social-emotional'],
    relatedGuideIds: ['toddler12to18-development', 'toddler18to24-play-imagination'],
  },

  // ---------------------------------------------------------------- 18–24 months
  {
    id: 'act-outdoor-exploration',
    title: 'Outdoor Exploration Walk',
    ageGroups: ['toddler18to24'],
    icon: 'exploration',
    shortDescription: 'A slow, toddler-paced walk to notice and explore the outside world.',
    whatYouNeed: ['A safe outdoor space (yard, park, or quiet path)'],
    howToDoIt: [
      'Let your toddler set the pace — this is a wandering walk, not a workout.',
      'Pause to look at leaves, stones, puddles, or bugs together.',
      'Name what you see and ask simple questions ("what color is that?").',
      'Bring a small bag if your toddler likes collecting safe little treasures.',
    ],
    developmentAreas: ['Gross motor skills', 'Language', 'Sensory processing'],
    safetyNote: 'Watch closely near roads, water, and anything small enough to be a choking hazard.',
    relatedGuideIds: ['toddler18to24-development'],
  },
  {
    id: 'act-storytime',
    title: 'Storytime and Picture Books',
    ageGroups: ['toddler18to24'],
    icon: 'reading',
    shortDescription: 'Slightly longer, more interactive story time as attention and vocabulary grow.',
    whatYouNeed: ['A few picture books with simple stories'],
    howToDoIt: [
      'Read a short, familiar story, pausing to ask "what\'s that?" or "what happens next?"',
      'Let your toddler fill in words they know, especially in repetitive or rhyming books.',
      'Re-read favorites often — repetition is genuinely valuable at this age, not a sign to switch books.',
      'Keep a couple of books within easy toddler reach for independent "reading" too.',
    ],
    developmentAreas: ['Language', 'Attention', 'Imagination'],
    relatedGuideIds: ['toddler18to24-play-imagination', 'toddler18to24-development'],
  },
  {
    id: 'act-sorting-matching',
    title: 'Simple Sorting and Matching Games',
    ageGroups: ['toddler18to24'],
    icon: 'exploration',
    shortDescription: 'Easy sorting-by-color or -shape play that builds early thinking skills.',
    whatYouNeed: ['A few household items in 2–3 clear colors, or simple shape toys'],
    howToDoIt: [
      'Lay out items in two or three distinct groups (by color or shape).',
      'Mix them up gently and invite your toddler to sort them back.',
      'Name the colors or shapes as you go, without turning it into a test.',
      'Keep sessions short — a few minutes of focused sorting is plenty.',
    ],
    developmentAreas: ['Cognitive skills', 'Fine motor skills', 'Early math concepts'],
    relatedGuideIds: ['toddler18to24-development'],
  },
];

export function getGuideActivityById(id: string): GuideActivity | undefined {
  return GUIDE_ACTIVITIES.find((a) => a.id === id);
}
