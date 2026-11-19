import type { StoryItem } from '../types/catalog';
import { toParagraphs } from './text';
import { SHORT_STORIES_PDF } from './shortStoriesPdfIndex';

export type ShortStorySection = {
  heading: string;
  body: string;
};

export type ShortStoryDef = {
  sortOrder: number;
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  moralEn: string;
  pdfStart: number;
  pdfEnd: number;
  sections: ShortStorySection[];
};

/**
 * Shama’il teaching stories from Iqra Publications — kept as their own
 * shelf so they do not crowd the seven chronological Seerah parts.
 */
export const SHORT_STORIES: ShortStoryDef[] = [
  {
    sortOrder: 1,
    slug: 'short-garbage-thrower',
    titleEn: 'The Garbage Thrower',
    titleAr: 'امرأة القمامة',
    summaryEn:
      'An old woman threw rubbish on him every day. When she fell ill, he visited her, cared for her, and she recognized the truth.',
    moralEn:
      'Learn compassion and patience from the Prophet ﷺ. He was treated roughly, yet he did not repay harm with harm — he cared for the one who troubled him.',
    pdfStart: 4,
    pdfEnd: 5,
    sections: [
      {
        heading: 'The Garbage Thrower',
        body: `There used to be an old lady in the time of Prophet Muhammad ﷺ who did not believe in his prophethood and disliked him for calling people to the oneness of God. Her dislike was so strong that she wanted to trouble him and draw out his anger, hoping to prove that he was an ordinary man who could be provoked.

One night she thought of a plan, and she was so eager to carry it out that she could not sleep. She woke before sunrise, swept her house, collected the rubbish in a basket, and placed it on the roof. She looked down at the street and thought, “No one has ever seen him angry. Every opponent will praise me when they see him shout at me. They will laugh at him and make fun of him.”

Then she heard footsteps. She saw him coming, dressed in clean white clothes. She lifted the basket and threw the rubbish on him as he passed. To her disappointment he did not say a word, and he continued on his way.

She did the same the next day, thinking she might finally annoy him. He was too gentle to shout at a woman. She mistook his patience for fear, and decided to repeat the mischief every day so that he might stop preaching the oneness of God.

He did not want to disappoint her, so he kept walking down that same street instead of choosing another route, and he prayed that she would recognize the truth.

One day he did not find her on the roof with the basket. That worried him. He knocked at the door. “Who is it?” asked a weak voice. “Muhammad ibn Abdullah,” he replied. “May I come in?” The woman was afraid. She thought he had come to take revenge, and she was too ill to fight or answer back. But his voice was so gentle that she let him in.

He told her that not finding her on the roof had worried him, and he had come to ask about her health. When he saw how ill she was, he asked if she needed any help. Softened by his kindness, she forgot her fear and asked for water. He gave her some, and prayed for her health while she drank.

She felt guilty for how she had treated him and apologized. He forgave her, and he came every day to clean her house, feed her, and pray for her until she was on her feet again. His kindness moved her to recognize the truth.`,
      },
    ],
  },
  {
    sortOrder: 2,
    slug: 'short-wealth-and-poverty',
    titleEn: 'Wealth and Poverty',
    titleAr: 'الغنى والفقر',
    summaryEn:
      'A richly dressed man drew his clothes away from a poor companion. The Prophet ﷺ asked why — and the poor man refused half the rich man’s wealth.',
    moralEn:
      'Islam does not teach us to separate rich from poor. Treat one another with kindness and respect. Arrogance has no place in this religion.',
    pdfStart: 6,
    pdfEnd: 7,
    sections: [
      {
        heading: 'Wealth and Poverty',
        body: `It was the usual gathering. Prophet Muhammad ﷺ sat with his companions around him, listening for words of wisdom and guidance.

A wealthy man in clean, elegant clothes arrived and sat before him. A short while later a poor man in old, worn clothes came, greeted the assembly with “Assalamu alaikum,” and sat in the first vacant place he found.

The Prophet ﷺ had taught them that the Muslims are brothers, and that in an assembly a person should sit wherever there is space, without regard to status. The poor man happened to sit next to the rich man. The rich man was uneasy and pulled the edges of his garment toward himself so the poor man would not touch them.

The Prophet ﷺ asked the rich man, “Did you fear that the poor person next to you might make your clothes dirty?”

“No,” he replied.

“Then why did you behave so?” the Prophet ﷺ asked.

“I admit that was the most undesirable thing to do. It was an error, and I confess my guilt. I have a companion within me that makes good deeds look ugly to me and ugly deeds look fair. O Prophet of Allah, as a punishment for this act I gift half of my wealth to the poor man.”

The Prophet ﷺ turned to the poor man and asked, “Do you accept the offer?”

“No, O Prophet of Allah,” he said.

Those present were surprised. Then the poor man explained: “O Prophet of Allah, I refuse because I fear that I might then become arrogant and treat my Muslim brothers the way he treated me.”`,
      },
    ],
  },
  {
    sortOrder: 3,
    slug: 'short-crying-camel',
    titleEn: 'The Crying Camel',
    titleAr: 'الجمل الباكي',
    summaryEn:
      'In a Madinah garden he found a camel tied in the heat, weeping. He comforted it and rebuked its owner for neglecting one of Allah’s creatures.',
    moralEn:
      'Show kindness to animals and to all living beings — they are creatures of Allah. Learn justice from the Prophet ﷺ.',
    pdfStart: 8,
    pdfEnd: 9,
    sections: [
      {
        heading: 'The Crying Camel',
        body: `It was a very hot day. The people of Madinah were looking for shade. In the gardens, under tall trees, they sat, talked, and drank.

The Prophet ﷺ was walking in one of those gardens. He loved to walk where it was green and cool, and to think quietly as he walked. He smiled at the people he knew.

Then he heard a strange sound — like someone crying, howling, deeply upset. As he came closer he saw it was not a person. It was a camel.

He felt sorry for it. It was tied to a post in the sun, hot and thirsty, tears on its cheeks, its fur wet. No one seemed to notice. He stroked the camel, and it grew calmer. After a while the howls became grunts, then sounds of ease. The tears stopped. The camel knew it had found a friend.

The Prophet ﷺ became angry. He walked the paths calling, “Who owns this camel?” At last a man stepped out from under the largest tree and said, “I do.”

The owner was not hot. He was not thirsty. He was not thinking about his camel. As the Prophet ﷺ spoke, the man’s head began to droop. He realized what he had done.

The Prophet ﷺ reminded him that the camel is one of Allah’s creatures. It works hard for its owner, carrying heavy loads and travelling far. In return, the owner should take great care of it.

The man felt ashamed. He had been cool and comfortable while the animal suffered — and his neglect had distressed the Messenger of Allah ﷺ. From that day he looked after his animals with care, and made sure they had enough to eat and drink. The camel never cried again.`,
      },
    ],
  },
  {
    sortOrder: 4,
    slug: 'short-promise-to-tell-the-truth',
    titleEn: 'A Promise to Tell the Truth',
    titleAr: 'وعد بالصدق',
    summaryEn:
      'A man asked which bad habit to give up first. “Lying,” said the Prophet ﷺ. Keeping that one promise pulled him away from the rest.',
    moralEn:
      'Always speak the truth. Those who are truthful are close to Allah. Truthfulness keeps a person from many sins in daily life.',
    pdfStart: 10,
    pdfEnd: 11,
    sections: [
      {
        heading: 'The Man Who Made a Promise to Tell the Truth',
        body: `A man came to the Prophet ﷺ and said, “O Prophet of Allah, I have many bad habits. Which of them should I give up first?”

The Prophet ﷺ said, “Give up telling lies first, and always speak the truth.” The man promised to do so and went home.

That night he was about to go out to steal. Then he thought of his promise. “If tomorrow the Prophet asks me where I have been, what shall I say? Shall I say I went out stealing? I cannot say that. But I cannot lie either. If I tell the truth, people will hate me and call me a thief, and I will be punished.” So he stayed home, and he gave up stealing.

The next day he felt like drinking wine. As he was about to do so he said to himself, “What shall I say if he asks what I did today? I cannot lie, and if I speak the truth people will hate me, because a Muslim is not allowed to drink wine.” So he gave up that as well.

Whenever he thought of doing something wrong, he remembered his promise to tell the truth. One by one he left his bad habits, and he became a good Muslim and a better person.`,
      },
    ],
  },
  {
    sortOrder: 5,
    slug: 'short-wealth-family-deeds',
    titleEn: 'Wealth, Family and His Deeds',
    titleAr: 'المال والأهل والعمل',
    summaryEn:
      'A dying man seeks three friends. Wealth and family can only go as far as the grave. Deeds walk with him beyond it.',
    moralEn:
      'Do not strive only for what ends with this life. Work, pray, and seek forgiveness. Good deeds remain when wealth and family can no longer help.',
    pdfStart: 12,
    pdfEnd: 13,
    sections: [
      {
        heading: 'Wealth, Family and His Deeds',
        body: `Once the Messenger of Allah ﷺ was sitting with his companions in the mosque when he said, “Today I shall narrate a story to you, which will reveal three riddles for you to solve.” The gathering grew quiet.

He told them of a man who learned that his days were few. He feared the loneliness of the grave and went looking for true friends who would help him and accompany him.

He knocked at the door of his first friend and asked for help. The friend said, “Of course — what are we here for?” But when the man said he had only a few days to live, the friend answered, “I am sorry. When death parts us there is nothing I can do for you except buy you a place in the graveyard and a shroud to cover you.” Grieved, the man went on.

At the second door he told the same story. That friend said, “I have been with you all your life and can help you here. After you die I can only take your body to the graveyard and bury you.”

Lost and almost without hope, he went to the third friend, expecting the same answer. He asked for help, and the friend volunteered at once. When the man said he needed help after death, the third friend replied, “Do not worry. I shall accompany you to the grave, be with you there, stay with you when the angels come to question you, assist you on the bridge, and lead you toward Paradise.” The man was at peace, and then he died.

The Prophet ﷺ asked if anyone could name the three friends and the man. When the silence remained, he said, “The man is any human being. The first friend is wealth — it helps in life, not after death. The second friend is family: we strive for them all our lives, and they give us a shoulder to the grave. The third and most important friend is deeds, which accompany a person all the way through.”`,
      },
    ],
  },
  {
    sortOrder: 6,
    slug: 'short-ramadan-story',
    titleEn: 'An Orphan on Eid',
    titleAr: 'يتيم يوم العيد',
    summaryEn:
      'After Eid prayer he found a boy crying in the road — father martyred, no home, no new clothes. He took him as family that day.',
    moralEn:
      'On the day of Eid, remember those who have less. Celebration is complete when we follow the Sunnah and look after the orphan and the lonely.',
    pdfStart: 14,
    pdfEnd: 15,
    sections: [
      {
        heading: 'Ramadan Story',
        body: `It was a day of celebration in Madinah. Young and old wore their best clothes for Eid. At the time of the early Eid prayer they went to open ground on the outskirts of the city. The Prophet ﷺ arrived and led the prayer. After the greetings, people walked home. Children ran and played, smiling, without a care.

As the Prophet ﷺ walked back, he noticed a little boy sitting alone by the path, crying. He bent down, patted his shoulder, and asked why he was crying. “Please leave me alone,” the boy sobbed, without even looking up.

The Prophet ﷺ ran his fingers through the boy’s hair and asked again, gently. This time the boy said, “My father was martyred fighting. My mother has married again, and my stepfather does not want me at home. Today is Eid and everyone is happy. The children have new clothes and good food, but I have only what I am wearing. I have no food, and I do not even have a place to live.”

The Prophet ﷺ said, “I know how you feel. I lost both my mother and my father when I was a little boy.” The boy was surprised that an orphan was comforting him. When he looked up and saw who it was, he jumped to his feet out of love and respect.

The Prophet ﷺ said, “If I were to become your new father, and my wife your new mother, and my daughter your new sister, would that make you feel better?”

“Oh yes — that would be the best thing in the world.” The boy began to smile. The Prophet ﷺ took him home and gave him new clothes and good food on that beautiful day. The boy had a wonderful Eid after all.`,
      },
    ],
  },
  {
    sortOrder: 7,
    slug: 'short-parents-in-islam',
    titleEn: 'Parents in Islam',
    titleAr: 'الوالدان في الإسلام',
    summaryEn:
      'Who has the greater right over a child? He named the mother three times before the father, and said one night of her due cannot be repaid.',
    moralEn:
      'Treat your parents with love and respect. After the Messenger of Allah ﷺ, a mother’s right is among the highest a person will ever owe.',
    pdfStart: 16,
    pdfEnd: 17,
    sections: [
      {
        heading: 'Parents in Islam',
        body: `Someone asked the Prophet ﷺ, “Who has the greater right over children, the mother or the father?”

He answered, “The mother’s right is greater than the father’s.” He was asked three times, and each time the answer was the same. The fourth time he said, “The father’s right is next.”

“Why do you give the mother three rights to the father’s one?”

He replied, “Your mother carried you for nine months in her womb, then gave you birth. After that she gave up her sleep for your sleep, nursed you, carried you in her arms, and cleaned you. For years she cooked for you, fed you, and served your food. She did your laundry. When you were forty, fifty, sixty, she still followed your progress with interest. Your father provided your food and made sure you had clothes to wear. Can this be compared with your mother’s role?”

The questioner said, “I wonder if I could ever repay my mother for all her help and service, however much I might do for her.”

The Messenger of Allah ﷺ replied, “You could not repay so much as one night’s due.”

“But suppose I carry my mother on my back for years, clean up after her, cook for her, and feed her? Suppose I attend to those same services as long as she may live?”

“There will still be this difference between you: your mother looked out for you to live, while you are waiting for her to die.”`,
      },
    ],
  },
  {
    sortOrder: 8,
    slug: 'short-what-is-religion',
    titleEn: 'What is Religion?',
    titleAr: 'ما هو الدين؟',
    summaryEn:
      'A man asked from every side, “What is religion?” Each time the answer was the same: good character — and not to be angry.',
    moralEn:
      'Akhlaq — good manners and morals — is a core part of Islam and of iman. Allah commands us throughout the Quran to develop good character and treat people well.',
    pdfStart: 18,
    pdfEnd: 19,
    sections: [
      {
        heading: 'What is Religion?',
        body: `A man came to the Prophet ﷺ and said, “O Messenger of Allah, what is religion?”

He replied, “Akhlaq — good conduct, morality.”

The man came in front of him and asked again. The answer was the same. He came to his left, then behind him, and each time he received the same reply: “Akhlaq.”

Then the Prophet ﷺ looked at him and said, “Not to be angry is akhlaq.”

He was asked, “What is misfortune?” He replied, “Bad conduct.”

Allah speaks in the Quran of the importance of good conduct, ethics, and character, and He reminds us again and again to treat people well.`,
      },
    ],
  },
  {
    sortOrder: 9,
    slug: 'short-allah-is-enough',
    titleEn: 'Allah is Enough as a Surety',
    titleAr: 'الله حسبنا وكيلاً',
    summaryEn:
      'A man lent a thousand dinars with Allah as witness and surety. The debtor, stranded overseas, entrusted the money to the sea — and it arrived.',
    moralEn:
      'Take Allah as your witness, and keep the promises you make.',
    pdfStart: 20,
    pdfEnd: 21,
    sections: [
      {
        heading: 'Allah is Enough as a Surety',
        body: `In the time of the Prophet ﷺ, a man from the Children of Israel asked another to lend him one thousand dinars. The lender asked for witnesses. The borrower said, “Allah is sufficient as a witness.” The lender asked for a surety. The borrower said, “Allah is sufficient as a surety.” The lender replied, “You are right,” and lent him the money for a set time.

The debtor travelled across the sea. When he finished his work he looked for a ship so he could repay on time, but he found none. So he took a piece of wood, made a hole in it, placed in it one thousand dinars and a letter to the lender, and sealed it tightly. He took the wood to the sea and said, “O Allah, You know that I took a loan of one thousand dinars from so-and-so. He asked for a surety and I told him Your guarantee was enough, and he accepted You. He asked for a witness and I told him You were enough, and he accepted You. I tried hard to find a conveyance so I could pay him, and I could not. So I hand this money to You.” Then he threw the wood far into the sea, and went on searching for a ship.

One day the lender came out of his house to see whether a ship had brought his money. Suddenly he saw the piece of wood. He took it home for firewood. When he sawed it open he found his money and the letter.

Shortly after that the debtor arrived with another thousand dinars and said, “By Allah, I tried hard to get a boat to bring you your money, but I could not find one before the boat I have come on.” The lender asked, “Have you sent something to me?” The debtor said he had not been able to find any boat except this one. The lender said, “Allah has delivered on your behalf the money you sent in the piece of wood. Keep your thousand dinars, and go guided on the right path.”`,
      },
    ],
  },
  {
    sortOrder: 10,
    slug: 'short-story-of-alqamah',
    titleEn: 'The Story of Alqamah',
    titleAr: 'قصة علقمة',
    summaryEn:
      'A devoted young man could not say the shahadah while his mother was angry with him. When she was pleased, his tongue was freed.',
    moralEn:
      'Honour your parents, and do not put anyone ahead of your mother. Her pleasure is a door to Allah’s pleasure.',
    pdfStart: 22,
    pdfEnd: 23,
    sections: [
      {
        heading: 'The Story of Alqamah',
        body: `In the time of the Prophet ﷺ there was a young man named Alqamah. He was diligent in prayer, fasting, and charity. Then he fell ill, and his illness became serious. His wife went to the Prophet ﷺ and said, “My husband, Alqamah, is on his deathbed. I came to tell you of his condition.”

The Prophet ﷺ sent companions — among them Ammar or Suhayb, and Bilal — to have him repeat the shahadah. They found him in the agony of death. They asked him to say “La ilaha illa Allah,” but his tongue could not pronounce it. They returned and told the Messenger of Allah ﷺ.

He asked, “Is either of his parents alive?” They said his mother was, though she was very old. He sent word that if she could come she should, otherwise he would go to her. She said, “May my life be a ransom for him — it is my pleasure to go to him.” Leaning on her stick, she came and greeted him.

He said, “Umm Alqamah, tell me the truth, for otherwise Allah will reveal the truth to me. What is the situation concerning your son?” She said he prayed much, fasted a great deal, and spent a great amount in charity. He asked, “And what about yourself?” She said, “I am angry with him.” “Why?” “He has preferred his wife to me and has disobeyed me.”

The Messenger of Allah ﷺ said, “Umm Alqamah, surely your anger has prevented Alqamah’s tongue from pronouncing the shahadah.” He turned to Bilal and said, “Go out and collect firewood.” She asked what he planned to do. He said, “I will burn him in front of your eyes.” She cried that he was her son, and that her heart could not bear it. He said, “Allah’s punishment is more severe and more lasting. If you want Allah to forgive him, be reconciled to him. By the One in Whose Hand is my soul, his prayer, fasting, and charity will not benefit him while you are angry with him.”

She said, “I call upon Allah, His angels, and the Muslims present to witness that I am pleased with my son Alqamah.” The Prophet ﷺ sent Bilal to see whether he could now say the shahadah — “It may be that she is saying something for my sake which is not in her heart.” As Bilal entered he heard Alqamah saying, “La ilaha illa Allah.” Bilal said, “While his mother was angry his tongue was tied; now that she is pleased, his tongue is freed.”

Alqamah died that same day. The Prophet ﷺ gave the order for his washing and shrouding, prayed the funeral prayer, and buried him. Then he stood by the grave and warned the Muhajirun and the Ansar not to favour a wife over a mother, and to seek a mother’s pleasure, for Allah’s pleasure is in her pleasure and His anger is in her anger.`,
      },
    ],
  },
  {
    sortOrder: 11,
    slug: 'short-black-stone',
    titleEn: 'Placing the Black Stone',
    titleAr: 'وضع الحجر الأسود',
    summaryEn:
      'Before prophethood, the clans of Quraysh nearly fought over who would set the Black Stone. Al-Amin laid it on a cloth so every tribe could lift it together.',
    moralEn:
      'Honesty, justice, and a calm mind can end a quarrel without bloodshed. The people already knew him as Al-Amin — the Trustworthy.',
    pdfStart: 24,
    pdfEnd: 26,
    sections: [
      {
        heading: 'Installation of the Sacred Black Stone',
        body: `When Muhammad ﷺ was thirty-five, a few years before he was sent as a messenger, a grave matter arose in Makkah.

Heavy rain had poured toward the Kaaba, which stood in the lower part of the city. The flood shook its foundations and cracked its walls. It had no ceiling, and the treasures it housed were exposed to theft. The Makkans had thought of rebuilding it, but they feared a curse if they put doors and a roof on the House of God.

Each of four clans was to demolish and rebuild one wall, yet no one wanted to begin the demolition, fearing punishment from their gods. At last al-Walid, after praying to those gods, pulled down part of the Yamani wall until the pillars laid by Prophet Ibrahim ﷺ appeared. When morning came and nothing had happened to him, the others took courage and began.

Muhammad ﷺ worked with them until the Kaaba was levelled except for green stones beneath the walls, which they could not shift and so used as the new foundations. From the neighbouring mountains they carried blue granite, and the walls rose quickly.

Each quarter belonged to a leading family of Quraysh. Then the sacred Black Stone — al-Hajar al-Aswad — had to be placed in the eastern wall. Dispute arose over who would have that honour. The quarrel grew into enmity, and the tribes prepared for war. The clan of Abd al-Dar filled a jar with blood and put their hands into it, pledging to fight to the death.

The discord lasted four or five days until Abu Umayyah, the oldest of Quraysh, said: let the first person who passes through the gate of the Haram be our arbitrator, and we will all accept his judgment. They agreed and waited.

They heard footsteps. It was Muhammad, the son of Abdullah. Everyone knew him, loved him, and respected him. They cried, “Here comes al-Amin — the Trustworthy! We will accept his verdict.”

He did not know of the quarrel until they told him. It was silent for a moment. Every family hoped to be favoured. He said, “Bring me a piece of cloth.” They brought it at once. He spread the cloth, placed the Black Stone in the middle, and said, “Each tribe should take hold of one side of the cloth so all can share in the honour.” They lifted it together to the place where it was to be set. Then he himself placed the Stone, so that if any one clan installed it alone the conflict would start again.

With that device he ended a bitter enmity without bloodshed. It showed his wisdom, his character, and the trust his people already placed in his judgment.`,
      },
    ],
  },
  {
    sortOrder: 12,
    slug: 'short-dialogue-with-a-traveler',
    titleEn: 'Dialogue with a Traveler',
    titleAr: 'حوار مع مسافر',
    summaryEn:
      'A traveler came from far away with a list of wishes. Each answer was a short, practical door to the character he ﷺ taught.',
    moralEn:
      'Good character is taught in small, repeatable acts: honour parents, fear Allah, remember death, keep the tongue, and treat people well.',
    pdfStart: 27,
    pdfEnd: 29,
    sections: [
      {
        heading: 'Dialogue between the Prophet and a Traveler',
        body: `A traveler once came to the mosque to see the Prophet ﷺ. After greeting him, he was asked where he had come from. He said he had come from very far to have a few questions answered.

He said, “I do not want punishment to be written in my account.” The Prophet ﷺ said, “Behave well with your parents.”

“I want to be known among people as an intelligent person.” “Fear Allah always.”

“I want to be counted among Allah’s favourites.” “Recite the Quran every morning and evening.”

“I want my heart to always be enlightened.” “Never forget death.”

“I never want to be away from Allah’s blessing.” “Always treat fellow creatures well.”

“I never want to be harmed by my enemies.” “Always have faith in Allah only.”

“I never want to be humiliated.” “Be careful of your actions.”

“I wish to live long.” “Always do good toward blood relations.”

“I want my sustenance to increase.” “Always remain in wudu.”

“I wish to stay free of punishment in the grave.” “Always wear clean clothes.”

“I never want to burn in Hell.” “Control your eyes and tongue.”

“How do I get my sins forgiven?” “Always ask forgiveness from Allah with humility.”

“I want to always be honoured.” “Never humiliate or put down anyone.”

“I do not want to be squeezed in the grave.” “Recite Surat al-Mulk often.”

“I want my wealth to increase.” “Recite Surat al-Waqi‘ah every night.”

“I want to be safe and at peace on the Day of Judgment.” “Remember Allah from dusk into the night.”

“I want full attention and concentration in prayer.” “Always make wudu with concentration and attention.”`,
      },
    ],
  },
];

export const SHORT_STORIES_SERIES = {
  title: 'Twelve Short Stories from His Life',
  credit: 'Iqra Publications — 12 Short Stories (in-app PDF)',
  description:
    'Simple teaching stories of his mercy, honesty, and character — a Shama’il shelf beside the chronological Seerah, not a second life-story.',
} as const;

export type ShortStoryChapter = {
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  moralEn: string;
  contentEn: string;
  sections: ShortStorySection[];
  durationMs: number;
  sortOrder: number;
  pdfStart: number;
  pdfEnd: number;
};

function cuesFromSections(
  sections: ShortStorySection[],
  durationMs: number,
): { startMs: number; endMs: number; textEn: string; textAr: string }[] {
  const chunks: { en: string }[] = [];
  for (const section of sections) {
    chunks.push({ en: section.heading });
    for (const para of toParagraphs(section.body)) {
      const sentences = para
        .split(/(?<=[.!?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
      if (sentences.length <= 2) chunks.push({ en: para });
      else {
        for (let i = 0; i < sentences.length; i += 2) {
          chunks.push({ en: sentences.slice(i, i + 2).join(' ') });
        }
      }
    }
  }
  const slice = Math.max(Math.floor(durationMs / Math.max(chunks.length, 1)), 6_000);
  return chunks.map((chunk, index) => ({
    textEn: chunk.en,
    textAr: '',
    startMs: index * slice,
    endMs: index === chunks.length - 1 ? durationMs : (index + 1) * slice,
  }));
}

function buildChapters(): ShortStoryChapter[] {
  return SHORT_STORIES.map((story) => {
    const moralSection: ShortStorySection = { heading: 'Moral', body: story.moralEn };
    const sections = [...story.sections, moralSection];
    const contentEn = sections
      .map((section) => `${section.heading}\n\n${section.body}`.trim())
      .join('\n\n');
    const durationMs = Math.max(90_000, Math.round(contentEn.length * 18));
    return {
      slug: story.slug,
      titleEn: story.titleEn,
      titleAr: story.titleAr,
      summaryEn: story.summaryEn,
      moralEn: story.moralEn,
      contentEn,
      sections,
      durationMs,
      sortOrder: story.sortOrder,
      pdfStart: story.pdfStart,
      pdfEnd: story.pdfEnd,
    };
  });
}

const chaptersBySlug = new Map(buildChapters().map((chapter) => [chapter.slug, chapter]));

export function getShortStory(slug: string): ShortStoryChapter | undefined {
  return chaptersBySlug.get(slug);
}

export function listShortStorySlugs(): string[] {
  return SHORT_STORIES.map((story) => story.slug);
}

export function isShortStoryFromTheLife(slug: string): boolean {
  return chaptersBySlug.has(slug);
}

export function shortStoryToStoryItem(slug: string): StoryItem | null {
  const chapter = getShortStory(slug);
  if (!chapter) return null;
  const minutes = Math.floor(chapter.durationMs / 60000);
  const seconds = Math.floor((chapter.durationMs % 60000) / 1000);
  return {
    id: chapter.slug,
    sectionSlug: 'seerah-shamail',
    title: chapter.titleEn,
    titleAr: chapter.titleAr,
    figureName: 'Muhammad',
    figureNameAr: 'محمد',
    honorific: 'peace and blessings of Allah be upon him',
    honorificAr: 'صلى الله عليه وسلم',
    summary: chapter.summaryEn,
    content: chapter.contentEn,
    durationLabel: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    durationMs: chapter.durationMs,
    authenticityGrade: 'historical',
    sourceCitation:
      'Iqra Publications, 12 Short Stories from the Life of the Prophet (in-app English PDF) — popular teaching retellings, not a graded hadith book.',
    sourceBook: `${SHORT_STORIES_PDF.author} — ${SHORT_STORIES_PDF.title}`,
    sourceVolume: SHORT_STORIES_PDF.edition,
    sourcePageOrHadith: `pp. ${chapter.pdfStart}–${chapter.pdfEnd} · Story ${chapter.sortOrder} of 12`,
    hasAudio: true,
    audioUrl: null,
    timedCues: cuesFromSections(chapter.sections, chapter.durationMs),
    isFavorite: false,
    keyTakeaway: chapter.moralEn,
  };
}

export function buildShortStoriesCatalog(): StoryItem[] {
  return listShortStorySlugs()
    .map((slug) => shortStoryToStoryItem(slug))
    .filter((story): story is StoryItem => Boolean(story));
}

/** Append the twelve teaching stories after the Seerah parts, before leftover fixtures. */
export function mergeShortStoriesIntoCatalog(stories: StoryItem[]): StoryItem[] {
  const slugs = new Set(listShortStorySlugs());
  const without = stories.filter((story) => !slugs.has(story.id));
  const seerah = without.filter((story) => story.sectionSlug === 'seerah-shamail');
  const rest = without.filter((story) => story.sectionSlug !== 'seerah-shamail');
  const parts = seerah.filter((story) => story.id.startsWith('seerah-'));
  const fixtures = seerah.filter((story) => !story.id.startsWith('seerah-'));
  return [...rest, ...parts, ...buildShortStoriesCatalog(), ...fixtures];
}
