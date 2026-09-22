import type { AgeGroupId } from './ageGroups';
import type { GuideCategoryId } from './categories';
import type { GuideIllustrationKey } from '../../components/guides/GuideIllustration';

export interface Guide {
  id: string;
  title: string;
  category: GuideCategoryId;
  ageGroups: AgeGroupId[];
  icon: GuideIllustrationKey;
  summary: string;
  intro: string;
  whyItMatters: string;
  whatToDo: string[];
  tips?: string[];
  safetyNote?: string;
  relatedGuideIds?: string[];
  relatedActivityIds?: string[];
  /** Shows the standard "not a substitute for professional care" footer. */
  medicalDisclaimer?: boolean;
}

export const GUIDES: Guide[] = [
  // ---------------------------------------------------------------- 0–3 months
  {
    id: 'newborn-development',
    title: "Getting to Know Your Newborn's Development",
    category: 'development',
    ageGroups: ['newborn'],
    icon: 'development',
    summary: 'What early reflexes, focus, and movement usually look like in the first weeks.',
    intro:
      'The first three months are about your baby adjusting to the world outside the womb. Development here is subtle — it shows up in tiny, steady changes rather than big leaps.',
    whyItMatters:
      'Knowing roughly what to expect can ease a lot of first-time worry, and helps you notice what your baby is actually doing instead of comparing them to a checklist.',
    whatToDo: [
      'Expect strong reflexes at first (startling, grasping, rooting) that fade over these months as your baby gains more control.',
      'Around 6–8 weeks, many babies start holding eye contact a little longer and briefly lifting their head during tummy time.',
      'Vision is still blurry beyond about 30cm, so faces up close are what your baby focuses on best.',
      'Short bursts of alert, calm wakefulness will slowly get longer as the weeks go on.',
    ],
    tips: [
      'Talk and make faces close up — this is genuinely one of the best things you can do at this stage.',
      'Every baby has their own pace. These are general patterns, not a schedule to hit.',
    ],
    safetyNote: 'Always place your baby on their back to sleep, on a firm flat surface with nothing loose in the sleep space.',
    relatedGuideIds: ['newborn-sleep', 'newborn-parenting'],
    relatedActivityIds: ['act-tummy-time', 'act-face-talking'],
    medicalDisclaimer: true,
  },
  {
    id: 'newborn-sleep',
    title: 'Newborn Sleep: What to Expect',
    category: 'sleep',
    ageGroups: ['newborn'],
    icon: 'sleep',
    summary: 'Why newborn sleep looks so scattered, and how to make it a little easier on you.',
    intro:
      "Newborn sleep doesn't follow a day/night pattern yet — and that's completely normal, not something to fix.",
    whyItMatters:
      'Understanding why sleep is so fragmented right now can take the pressure off trying to force a routine too early.',
    whatToDo: [
      'Newborns typically sleep in short stretches around the clock, often 2–4 hours at a time, driven by hunger rather than a clock.',
      "There's no real day/night rhythm yet — that begins to emerge gradually over the next couple of months.",
      'Gentle cues (dimming lights in the evening, keeping night feeds low-key and quiet) can slowly help your baby start telling day from night.',
      "Short, light naps are normal and don't need to be discouraged.",
    ],
    tips: ['Sleep when you can, not just at night — matching your baby\'s pattern is often more sustainable than fighting it.'],
    safetyNote:
      'Follow safe sleep basics every sleep, every time: back to sleep, firm flat surface, no loose bedding, pillows, or soft toys in the sleep space, and room-sharing (not bed-sharing) is generally recommended for the first months.',
    relatedGuideIds: ['newborn-development'],
    medicalDisclaimer: true,
  },
  {
    id: 'newborn-feeding',
    title: 'Feeding Your Newborn: Breast, Bottle, and Cues',
    category: 'feeding',
    ageGroups: ['newborn'],
    icon: 'feeding',
    summary: 'Reading hunger and fullness cues in the earliest weeks, whichever way you feed.',
    intro:
      'Whether you breastfeed, bottle-feed, or both, the first weeks are mostly about learning your baby\'s individual cues.',
    whyItMatters:
      'Newborns often can\'t wait to "cry" for food — learning the earlier cues makes feeds calmer for both of you.',
    whatToDo: [
      'Look for early hunger cues: rooting, hand-to-mouth movements, smacking lips — crying is usually a later, more frustrated sign.',
      'Most newborns feed frequently — roughly every 2–3 hours is common in the early weeks, including overnight.',
      'Fullness cues include turning away, relaxed hands, or slowing down and drifting toward sleep.',
      'Frequent, short feeds are normal in the first weeks as supply and routine settle in.',
    ],
    tips: ['If feeding feels consistently painful, stressful, or you\'re worried about weight gain, a lactation consultant or your pediatrician can help — this is common and very fixable.'],
    relatedGuideIds: ['newborn-parenting'],
    medicalDisclaimer: true,
  },
  {
    id: 'newborn-parenting',
    title: 'Adjusting to Life With a Newborn',
    category: 'parenting',
    ageGroups: ['newborn'],
    icon: 'parenting',
    summary: 'A gentle reminder that the fourth trimester is hard for parents too — and that\'s normal.',
    intro:
      'The early weeks reshape everything about your day, your sleep, and your sense of routine. It\'s a huge adjustment, not a personal failing if it feels hard.',
    whyItMatters:
      'Parents under-rest and under-support themselves more than babies do — looking after yourself is part of looking after your baby.',
    whatToDo: [
      'Lower the bar on everything except your baby\'s basic needs and your own rest for these first weeks.',
      'Accept help when it\'s offered, and be specific when you ask for it ("could you hold the baby while I shower" is easier to say yes to than "help me").',
      'Expect a wide emotional range — this is common in the days and weeks after birth.',
      'Build a small support loop: one person you can text honestly, even just to say "today was hard."',
    ],
    safetyNote:
      'If low mood, anxiety, or intrusive thoughts last more than two weeks, feel severe, or you ever feel unsafe, reach out to your healthcare provider promptly — postpartum mood changes are common and treatable, and you deserve support.',
    relatedGuideIds: ['newborn-sleep'],
    medicalDisclaimer: true,
  },

  // ---------------------------------------------------------------- 3–6 months
  {
    id: 'infant3to6-development',
    title: "Your Baby at 3–6 Months: Rolling, Reaching, and Discovering Hands",
    category: 'development',
    ageGroups: ['infant3to6'],
    icon: 'development',
    summary: 'The stretch where babies start noticing their own hands and pushing up during tummy time.',
    intro:
      'This is often the stage where a newborn starts to feel like a "baby" — more alert, more expressive, and increasingly interested in their own body.',
    whyItMatters:
      'Recognizing these changes helps you offer the right kind of play at the right moment, without needing it to happen on any fixed date.',
    whatToDo: [
      'Many babies start pushing up on their forearms, and later their hands, during tummy time in this window.',
      'Hands become fascinating — watch for batting at toys, bringing hands to midline, and mouthing everything within reach.',
      'Rolling (often back-to-front or front-to-back first) commonly begins somewhere in this range, though timing varies a lot.',
      'Laughing, cooing, and more varied vowel sounds usually increase noticeably.',
    ],
    tips: ['Every baby reaches these in a different order and pace — there\'s no single "correct" sequence.'],
    safetyNote: 'Once your baby can roll, stop swaddling arms-in and always supervise time on beds, changing tables, or other raised surfaces.',
    relatedGuideIds: ['infant3to6-play'],
    relatedActivityIds: ['act-reach-grasp', 'act-mirror-play'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant3to6-sleep',
    title: 'Building Gentle Sleep Routines',
    category: 'sleep',
    ageGroups: ['infant3to6'],
    icon: 'sleep',
    summary: 'How a simple, predictable wind-down can start to help around this age.',
    intro:
      'Around 3–6 months, many families find a simple bedtime routine starts to genuinely help, as day/night rhythms mature.',
    whyItMatters:
      'A short, consistent sequence signals "sleep is coming" to your baby\'s brain, which can make settling easier over time.',
    whatToDo: [
      'Keep the routine short and repeatable: for example, bath, feed, dim lights, a short song, then bed.',
      'Naps are often still irregular in length at this stage — that\'s normal and tends to settle more from 6 months on.',
      'Try to put your baby down drowsy but still a little awake sometimes, to gently support self-settling — without pressure if it doesn\'t click yet.',
      'Keep the room dim and calm for night feeds so it stays clearly different from daytime.',
    ],
    tips: ['Consistency matters more than any specific routine — pick something simple you can realistically repeat every night.'],
    safetyNote: 'Continue safe sleep practices: back to sleep, firm flat surface, no loose bedding or soft toys in the crib.',
    relatedGuideIds: ['infant3to6-development'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant3to6-feeding',
    title: 'Feeding Rhythms From 3 to 6 Months',
    category: 'feeding',
    ageGroups: ['infant3to6'],
    icon: 'feeding',
    summary: 'What tends to change in feeding volume and pattern before solids begin.',
    intro:
      'Feeds often become more efficient and slightly more spaced out during this window, though every baby\'s pattern differs.',
    whyItMatters:
      'Knowing what\'s typical can help you tell the difference between a normal change in pattern and something worth asking your pediatrician about.',
    whatToDo: [
      'Feeds may become quicker and better-spaced as your baby gets more efficient at feeding.',
      'A "growth spurt" — a few days of noticeably more frequent feeding — is common and usually settles back down within a week or so.',
      'Solid food isn\'t needed yet for most babies before about 6 months; breast milk or formula remains the main source of nutrition in this window.',
      'Watch for your pediatrician\'s cues at check-ups about when your baby might be ready to start solids.',
    ],
    safetyNote: 'If you have concerns about weight gain, feeding difficulty, or reflux, check in with your pediatrician rather than guessing.',
    relatedGuideIds: ['infant6to9-feeding-solids'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant3to6-play',
    title: 'The World Through Play: 3–6 Months',
    category: 'play',
    ageGroups: ['infant3to6'],
    icon: 'play',
    summary: 'Why simple, sensory play matters more than "educational" toys right now.',
    intro:
      "At this age, play is really about your baby practicing their senses and their new hand control — it doesn't need to be complicated.",
    whyItMatters:
      'Simple, repeated sensory experiences (sounds, textures, faces) genuinely support development more than a shelf of toys does.',
    whatToDo: [
      'Offer a few safe, easy-to-grasp toys with different textures rather than a large pile of options.',
      'Talk through what you\'re doing during everyday moments — nappy changes and dressing are play too, at this age.',
      'Give unhurried tummy time daily, even in short bursts, to build the strength your baby is starting to use.',
      'Follow your baby\'s lead: if they look away or fuss, that\'s a natural cue to pause, not push on.',
    ],
    relatedGuideIds: ['infant3to6-development'],
    relatedActivityIds: ['act-reach-grasp', 'act-textured-sensory', 'act-mirror-play'],
  },

  // ---------------------------------------------------------------- 6–9 months
  {
    id: 'infant6to9-development',
    title: 'Sitting, Crawling, and Exploring: 6–9 Months',
    category: 'development',
    ageGroups: ['infant6to9'],
    icon: 'development',
    summary: 'The stage where babies often become genuinely mobile for the first time.',
    intro:
      'This stretch is often a visible turning point — many babies go from "staying where you put them" to actively getting around.',
    whyItMatters:
      'Mobility changes your baby-proofing needs fast, so it helps to know roughly when to expect it.',
    whatToDo: [
      'Sitting without support often becomes steady somewhere in this window.',
      'Crawling (or another way of getting around, like scooting) frequently emerges, though the exact style and timing vary widely — some babies skip crawling altogether.',
      'A pincer-ish grasp starts developing, making small (safe, supervised) finger foods more manageable.',
      'Babbling often becomes more consonant-heavy ("bababa", "dadada") around this time.',
    ],
    tips: ['Skipping or reordering a "typical" milestone sequence is common and not a cause for alarm on its own.'],
    safetyNote: 'Once your baby is mobile, re-check your space at floor level for choking hazards, cords, unstable furniture, and stairs.',
    relatedGuideIds: ['infant6to9-parenting-anxiety'],
    relatedActivityIds: ['act-floor-play', 'act-object-basket'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant6to9-sleep',
    title: 'Naps and Night Sleep at 6–9 Months',
    category: 'sleep',
    ageGroups: ['infant6to9'],
    icon: 'sleep',
    summary: 'Why sleep can wobble here even after it felt settled — and what usually helps.',
    intro:
      'It\'s common for sleep to feel like it\'s "regressing" around this age, often alongside new mobility or separation awareness.',
    whyItMatters:
      'Knowing this is a common, temporary pattern (not a routine gone wrong) can make it easier to ride out.',
    whatToDo: [
      'Many babies settle into roughly two to three naps a day around this stage.',
      'New skills (like practicing sitting or crawling) can genuinely disrupt sleep for a while as the brain is busy processing them.',
      'Keep the bedtime routine consistent even during a rough patch — it\'s often the anchor that helps things settle again.',
      'A short, calm response to night wakings (without introducing big new habits) tends to help more than dramatic changes.',
    ],
    safetyNote: 'Continue back-to-sleep and a clear crib free of loose bedding, bumpers, and soft toys.',
    relatedGuideIds: ['infant6to9-development'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant6to9-feeding-solids',
    title: 'Starting Solid Foods',
    category: 'feeding',
    ageGroups: ['infant6to9'],
    icon: 'feeding',
    summary: 'A gentle, practical starting point for introducing first foods.',
    intro:
      'Most babies are ready to start solids somewhere around 6 months, alongside continued breast milk or formula — this guide covers the practical basics.',
    whyItMatters:
      'Starting solids is a big, exciting step, and a calm, unhurried approach tends to make it easier for everyone.',
    whatToDo: [
      'Look for readiness signs: sitting with support, good head control, and interest in food, alongside reaching the general age range your pediatrician recommends.',
      'Start with single, simple foods, offered one at a time, to make it easier to notice any reaction.',
      'Textures can begin soft and smooth or appropriately soft finger-sized pieces, depending on the approach you and your pediatrician choose.',
      'Let mess happen — exploring food with hands and face is a normal, useful part of learning to eat.',
      'Breast milk or formula remains the main source of nutrition for a good while yet; solids start as practice and exploration, not a replacement.',
    ],
    tips: ['There isn\'t one "right" method — spoon-fed purees, baby-led weaning, or a mix can all work well; choose what fits your family.'],
    safetyNote:
      'Always supervise your baby during meals, avoid choking hazards (whole grapes, nuts, hard raw vegetables, popcorn, etc.), and check with your pediatrician about introducing common allergens and any family history of food allergy.',
    relatedGuideIds: ['infant3to6-feeding', 'infant9to12-feeding'],
    relatedActivityIds: ['act-object-basket'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant6to9-parenting-anxiety',
    title: 'Stranger and Separation Anxiety',
    category: 'parenting',
    ageGroups: ['infant6to9'],
    icon: 'parenting',
    summary: 'Why your easygoing baby might suddenly cry at grandparents or drop-offs.',
    intro:
      'A wave of clinginess around familiar faces disappearing (even briefly) is extremely common in this stage, and it\'s actually a sign of healthy attachment.',
    whyItMatters:
      'Understanding this as a developmental phase — not a step backward — can make goodbyes feel less discouraging.',
    whatToDo: [
      'Keep goodbyes brief, warm, and consistent rather than sneaking away, which can increase anxiety over time.',
      'Give new caregivers or relatives a little warm-up time near you before a handoff, where possible.',
      'A predictable "goodbye ritual" (a wave, a phrase) can help your baby anticipate what\'s happening.',
      'This phase typically eases with time as your baby\'s sense of object permanence and trust grows.',
    ],
    relatedGuideIds: ['infant6to9-development'],
    medicalDisclaimer: true,
  },

  // ---------------------------------------------------------------- 9–12 months
  {
    id: 'infant9to12-development',
    title: 'Cruising Toward Walking: 9–12 Months',
    category: 'development',
    ageGroups: ['infant9to12'],
    icon: 'development',
    summary: 'Pulling up, cruising along furniture, and the run-up to first steps.',
    intro:
      'This is often the "getting upright" stage — a lot of energy goes into pulling up, cruising, and testing balance.',
    whyItMatters:
      'Knowing this range helps you set up a safe space for practice without expecting walking on a fixed date.',
    whatToDo: [
      'Pulling to stand on furniture and "cruising" along it sideways commonly develops in this window.',
      'First independent steps happen for some babies right around 12 months, and for plenty of others well after — both are typical.',
      'A simple wave, pointing, or early single words ("mama," "dada," or similar) often start to appear.',
      'Understanding of simple words and routines (like waving at "bye-bye") usually grows well ahead of speaking them.',
    ],
    tips: ['Walking age varies hugely and isn\'t linked to later ability — there\'s no need to compare between babies.'],
    safetyNote: 'Secure furniture that could tip, and keep an eye on stairs and low tables as your baby starts pulling up and cruising.',
    relatedGuideIds: ['infant9to12-play'],
    relatedActivityIds: ['act-cruising-play', 'act-stack-nest'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant9to12-feeding',
    title: 'Feeding a Curious 9–12 Month Old',
    category: 'feeding',
    ageGroups: ['infant9to12'],
    icon: 'feeding',
    summary: 'Moving toward more textures, more independence, and shared family meals.',
    intro:
      'By now many babies are eating a wider range of textures and starting to want to feed themselves — messy as that is.',
    whyItMatters:
      'Letting your baby practice self-feeding now builds real skills, even though it\'s slower and messier than feeding them yourself.',
    whatToDo: [
      'Offer more varied textures — soft finger foods, mashed or chopped meals — moving beyond purees as your baby manages it.',
      'Let your baby practice with a spoon or their hands, even if most of it ends up on the floor at first.',
      'Sharing simple, appropriately-prepared family meals at this stage can help your baby learn to eat what the family eats.',
      'Offer water in a cup alongside meals to start building that habit.',
    ],
    safetyNote: 'Keep cutting food into small, manageable pieces and avoid common choking hazards; always supervise meals.',
    relatedGuideIds: ['infant6to9-feeding-solids', 'toddler12to18-feeding'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant9to12-sleep',
    title: 'Sleep Changes Around the First Birthday',
    category: 'sleep',
    ageGroups: ['infant9to12'],
    icon: 'sleep',
    summary: 'Why naps often start shifting from three to two around this stage.',
    intro:
      'Many babies begin dropping from three naps to two somewhere in this window, though the exact timing is very individual.',
    whyItMatters:
      'Recognizing a nap transition (rather than assuming something is "wrong") helps you adjust the schedule calmly instead of fighting it.',
    whatToDo: [
      'Watch for signs of a nap transition: fighting a nap that used to be easy, or a shift in when your baby seems tired.',
      'Shift nap and bedtime slightly later in small steps rather than all at once, if a transition seems to be happening.',
      'Keep the same simple wind-down routine — it stays useful through every sleep transition.',
      'Expect some disruption around new physical skills (like practicing standing) — it usually settles as the skill becomes second nature.',
    ],
    safetyNote: 'Continue safe sleep practices as your baby becomes more mobile in the crib.',
    relatedGuideIds: ['infant9to12-development'],
    medicalDisclaimer: true,
  },
  {
    id: 'infant9to12-play',
    title: 'Hands-On Discovery: 9–12 Months',
    category: 'play',
    ageGroups: ['infant9to12'],
    icon: 'play',
    summary: 'Why filling, dumping, and repeating things over and over is exactly the point.',
    intro:
      'Babies this age often become obsessed with putting things in and taking them out, again and again — it looks repetitive, but it\'s genuinely productive play.',
    whyItMatters:
      'Understanding why your baby wants to do the "boring" thing fifty times helps you support it instead of rushing them along.',
    whatToDo: [
      'Offer simple containers and safe household objects for filling and dumping — this builds cause-and-effect understanding.',
      'Stacking and nesting toys support early problem-solving as your baby experiments with what fits where.',
      'Reading short board books together, even briefly, supports language even before your baby sits still for a full story.',
      'Let repetition happen — doing the same thing over and over is how this age group actually learns.',
    ],
    relatedGuideIds: ['infant9to12-development'],
    relatedActivityIds: ['act-stack-nest', 'act-reading-together'],
  },

  // ---------------------------------------------------------------- 12–18 months
  {
    id: 'toddler12to18-development',
    title: 'First Steps and Early Words: 12–18 Months',
    category: 'development',
    ageGroups: ['toddler12to18'],
    icon: 'development',
    summary: 'Walking becomes more confident, and single words start turning into a small vocabulary.',
    intro:
      'Somewhere in this stretch, most babies move from "new toddler" to genuinely walking, exploring, and starting to communicate with words.',
    whyItMatters:
      'This is a big jump in independence, which is exciting — and also explains a lot of the new (sometimes exhausting) behavior.',
    whatToDo: [
      'Walking typically becomes steadier and more confident, with fewer falls, over this period.',
      'Vocabulary often grows from a handful of words toward a wider range by 18 months, though the pace varies a lot between children.',
      'Pointing to show you things, and following simple one-step instructions, are common developments in this window.',
      'Pretend play often starts appearing in a simple form — like "feeding" a stuffed animal.',
    ],
    tips: ['Language development especially varies a lot — some toddlers talk early and walk late, or the reverse, and both are normal.'],
    relatedGuideIds: ['toddler12to18-parenting-tantrums'],
    relatedActivityIds: ['act-obstacle-course', 'act-pretend-play-basics'],
    medicalDisclaimer: true,
  },
  {
    id: 'toddler12to18-feeding',
    title: 'Feeding an Independent Toddler',
    category: 'feeding',
    ageGroups: ['toddler12to18'],
    icon: 'feeding',
    summary: 'Handling the shift from "eats anything" to a toddler with opinions.',
    intro:
      "Around this age it's common for appetite to become less predictable as growth slows down slightly and your toddler asserts more preference.",
    whyItMatters:
      'Knowing this shift is developmental, not a feeding failure, can take a lot of mealtime stress off the table (literally).',
    whatToDo: [
      'Offer a variety of foods regularly, without pressure to finish — appetite naturally varies day to day at this age.',
      'Let your toddler practice with cutlery and a cup, even though it\'s messy and slow.',
      'Keep mealtimes calm and low-pressure — toddlers often eat better without a lot of attention on how much they\'re eating.',
      'Repeated, low-key exposure to a food (sometimes many tries) is often what eventually helps a toddler accept it.',
    ],
    safetyNote: 'Continue cutting food to avoid choking hazards, and supervise meals closely.',
    relatedGuideIds: ['infant9to12-feeding', 'toddler18to24-feeding-picky'],
    medicalDisclaimer: true,
  },
  {
    id: 'toddler12to18-sleep',
    title: 'Toddler Sleep and the One-Nap Transition',
    category: 'sleep',
    ageGroups: ['toddler12to18'],
    icon: 'sleep',
    summary: 'What to expect as most toddlers move from two naps down to one.',
    intro:
      'Many toddlers shift from two naps to a single midday nap somewhere in this window — often accompanied by a few rocky weeks.',
    whyItMatters:
      'Knowing this transition is coming can help you read the signs early instead of assuming bedtime battles mean something else.',
    whatToDo: [
      'Watch for signs of readiness: consistently fighting one of the two naps, or one nap running much later into the day.',
      'Shift toward a single, slightly longer midday nap gradually, moving bedtime a bit earlier in the meantime if your toddler seems overtired.',
      'Expect some short-term crankiness during the transition — it usually settles within a few weeks.',
      'Keep the bedtime routine simple and consistent through the change.',
    ],
    relatedGuideIds: ['toddler12to18-development'],
    medicalDisclaimer: true,
  },
  {
    id: 'toddler12to18-parenting-tantrums',
    title: 'Understanding Toddler Tantrums',
    category: 'parenting',
    ageGroups: ['toddler12to18'],
    icon: 'parenting',
    summary: 'Why big feelings show up now, and how to respond without escalating.',
    intro:
      'As toddlers develop stronger wants and opinions but not yet the words or self-control to manage them, frustration often comes out as a tantrum.',
    whyItMatters:
      'Seeing tantrums as a skills gap (not defiance) changes how you respond — and tends to make things calmer for both of you.',
    whatToDo: [
      'Stay calm and nearby rather than trying to reason extensively — toddlers can\'t process much language mid-meltdown.',
      'Name the feeling simply once things start settling: "you\'re really frustrated" — this builds emotional vocabulary over time.',
      'Keep expectations realistic: tantrums are a normal, expected part of this stage, not a parenting failure.',
      'Offer small, safe choices during the day ("red cup or blue cup?") — a little control often reduces power struggles.',
    ],
    relatedGuideIds: ['toddler12to18-development', 'toddler18to24-parenting-independence'],
  },

  // ---------------------------------------------------------------- 18–24 months
  {
    id: 'toddler18to24-development',
    title: 'Your Toddler at 18–24 Months: Language and Independence',
    category: 'development',
    ageGroups: ['toddler18to24'],
    icon: 'development',
    summary: 'Vocabulary often expands quickly, alongside a strong new sense of "me too" and "mine."',
    intro:
      'This stretch often brings a noticeable language jump alongside a fierce new drive to do things independently — sometimes both at once, loudly.',
    whyItMatters:
      'Knowing this is a normal, healthy push for independence (not just stubbornness) helps you pick battles more calmly.',
    whatToDo: [
      'Many toddlers move from single words to short two-word phrases somewhere in this range ("more milk," "go outside").',
      'Running, climbing, and kicking a ball often become steadier as balance and coordination improve.',
      'Simple pretend play (feeding a doll, "talking" on a toy phone) often becomes richer and more imaginative.',
      '"I do it" moments increase a lot — offering safe ways to help builds real confidence.',
    ],
    tips: ['Vocabulary size varies enormously at this age and is a poor predictor of later ability on its own.'],
    relatedGuideIds: ['toddler18to24-parenting-independence', 'toddler18to24-play-imagination'],
    relatedActivityIds: ['act-storytime', 'act-sorting-matching'],
    medicalDisclaimer: true,
  },
  {
    id: 'toddler18to24-feeding-picky',
    title: 'Mealtimes With a Toddler: Managing Picky Eating',
    category: 'feeding',
    ageGroups: ['toddler18to24'],
    icon: 'feeding',
    summary: 'Practical, low-stress ways to handle a toddler who suddenly refuses foods they used to love.',
    intro:
      "Picky eating peaks for a lot of toddlers around this age, and it's rarely about the food itself.",
    whyItMatters:
      'Understanding picky eating as a normal (if frustrating) phase helps you avoid turning mealtimes into a daily battle.',
    whatToDo: [
      'Keep offering a variety of foods without pressure — your job is to offer, your toddler\'s job is to decide how much to eat.',
      'Serve a "safe" food alongside something new, so your toddler always has something they\'ll eat.',
      'Avoid separate "toddler meals" every time it gets rejected — repeated calm exposure usually works better long-term than replacing food.',
      'Keep portions small; a toddler-sized "no thank you" pile is easier to try again than a big serving.',
    ],
    safetyNote: 'If you\'re worried about very limited eating, significant weight changes, or a possible allergy, check in with your pediatrician.',
    relatedGuideIds: ['toddler12to18-feeding'],
    medicalDisclaimer: true,
  },
  {
    id: 'toddler18to24-sleep',
    title: 'Sleep Routines for Growing Toddlers',
    category: 'sleep',
    ageGroups: ['toddler18to24'],
    icon: 'sleep',
    summary: 'Keeping sleep steady through a stage full of new independence and opinions.',
    intro:
      "Toddlers this age often start testing bedtime the same way they test everything else — sleep itself usually hasn't changed much, but cooperation has.",
    whyItMatters:
      'A calm, boundaried bedtime approach tends to work better than either giving in completely or turning it into a nightly battle.',
    whatToDo: [
      'Keep the bedtime routine short, predictable, and low-stimulation (bath, book, song, lights out).',
      'Offer a small choice within the routine ("which pyjamas?") to satisfy some of that new independence.',
      'Set a clear, kind boundary once the routine is done, and calmly repeat it if your toddler tests it — consistency matters more than any single tactic.',
      'One nap a day is typical at this stage for most toddlers, usually easing toward no nap later in toddlerhood.',
    ],
    relatedGuideIds: ['toddler12to18-sleep'],
    medicalDisclaimer: true,
  },
  {
    id: 'toddler18to24-play-imagination',
    title: 'Encouraging Imaginative Play',
    category: 'play',
    ageGroups: ['toddler18to24'],
    icon: 'play',
    summary: 'Why pretend play is showing up now, and simple ways to join in without taking over.',
    intro:
      'Pretend play often blossoms in this stage — feeding a teddy bear, "driving" a box, talking into a banana like a phone.',
    whyItMatters:
      'Imaginative play supports language, problem-solving, and early emotional understanding, and it\'s genuinely fun for toddlers.',
    whatToDo: [
      'Follow your toddler\'s lead rather than directing the pretend scenario yourself.',
      'Simple, open-ended props (a box, a scarf, kitchen items) often spark more imagination than very literal toys.',
      'Narrate gently as you play alongside them — it builds vocabulary without turning play into a lesson.',
      'Short attention spans are normal — a few minutes of engaged pretend play is a full "session" at this age.',
    ],
    relatedGuideIds: ['toddler18to24-development'],
    relatedActivityIds: ['act-pretend-play-basics', 'act-storytime'],
  },
  {
    id: 'toddler18to24-parenting-independence',
    title: "Supporting Your Toddler's Growing Independence",
    category: 'parenting',
    ageGroups: ['toddler18to24'],
    icon: 'parenting',
    summary: 'Practical ways to say "yes" to independence while keeping days manageable.',
    intro:
      'The push for "I do it myself" is strong at this age — and while it can slow everything down, it\'s an important part of healthy development.',
    whyItMatters:
      'Finding small, safe ways to let your toddler do things themselves builds real confidence and often reduces power struggles elsewhere.',
    whatToDo: [
      'Build in a little extra time for tasks your toddler wants to do themselves, like getting dressed or climbing into their car seat.',
      'Offer two acceptable choices instead of open-ended ones ("blue shirt or red shirt?") — easier for toddlers to manage than unlimited options.',
      'Let small mistakes happen where it\'s safe to — spilled water while pouring is a fine price for a toddler learning a new skill.',
      'Praise effort and process ("you worked hard on that") rather than only the result.',
    ],
    relatedGuideIds: ['toddler12to18-parenting-tantrums', 'toddler18to24-development'],
  },
];

export function getGuideById(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}
