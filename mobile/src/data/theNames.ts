/**
 * Asma’ul Husna — the 99 beautiful names of Allah with concise English meanings.
 * Learning companion series credit: “The Names” by Shaykh Mikaeel Smith
 * (delivery reference only — not an endorsement or voice impersonation).
 */

export interface DivineName {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  reflection: string;
}

export const THE_NAMES_SERIES = {
  title: 'The Names',
  scholar: 'Shaykh Mikaeel Smith',
  credit: 'The Names — Shaykh Mikaeel Smith',
  description:
    'Explore Allah’s beautiful names with clear meanings. This section is inspired by the learning series The Names by Shaykh Mikaeel Smith.',
} as const;

export const divineNames: DivineName[] = [
  { number: 1, arabic: 'الرَّحْمَٰنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Merciful', reflection: 'His mercy embraces all creation.' },
  { number: 2, arabic: 'الرَّحِيمُ', transliteration: 'Ar-Raheem', meaning: 'The Especially Merciful', reflection: 'A tender mercy reserved for the believers.' },
  { number: 3, arabic: 'الْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King', reflection: 'Absolute sovereignty belongs to Him alone.' },
  { number: 4, arabic: 'الْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Holy', reflection: 'Free from every imperfection and need.' },
  { number: 5, arabic: 'السَّلَامُ', transliteration: 'As-Salam', meaning: 'The Source of Peace', reflection: 'True safety and peace come from Him.' },
  { number: 6, arabic: 'الْمُؤْمِنُ', transliteration: 'Al-Mu’min', meaning: 'The Giver of Faith', reflection: 'He grants security and affirms truth.' },
  { number: 7, arabic: 'الْمُهَيْمِنُ', transliteration: 'Al-Muhaymin', meaning: 'The Guardian', reflection: 'He watches over and preserves all things.' },
  { number: 8, arabic: 'الْعَزِيزُ', transliteration: 'Al-Aziz', meaning: 'The Almighty', reflection: 'Invincible in might and honor.' },
  { number: 9, arabic: 'الْجَبَّارُ', transliteration: 'Al-Jabbar', meaning: 'The Compeller', reflection: 'He mends what is broken and enforces His will.' },
  { number: 10, arabic: 'الْمُتَكَبِّرُ', transliteration: 'Al-Mutakabbir', meaning: 'The Supreme', reflection: 'Greatness belongs only to Him.' },
  { number: 11, arabic: 'الْخَالِقُ', transliteration: 'Al-Khaliq', meaning: 'The Creator', reflection: 'He brings everything into being.' },
  { number: 12, arabic: 'الْبَارِئُ', transliteration: 'Al-Bari', meaning: 'The Originator', reflection: 'He forms creation with perfect proportion.' },
  { number: 13, arabic: 'الْمُصَوِّرُ', transliteration: 'Al-Musawwir', meaning: 'The Fashioner', reflection: 'He shapes every form with wisdom.' },
  { number: 14, arabic: 'الْغَفَّارُ', transliteration: 'Al-Ghaffar', meaning: 'The Oft-Forgiving', reflection: 'He repeatedly covers and forgives sins.' },
  { number: 15, arabic: 'الْقَهَّارُ', transliteration: 'Al-Qahhar', meaning: 'The Subduer', reflection: 'Nothing overcomes His dominion.' },
  { number: 16, arabic: 'الْوَهَّابُ', transliteration: 'Al-Wahhab', meaning: 'The Bestower', reflection: 'He gives freely without obligation.' },
  { number: 17, arabic: 'الرَّزَّاقُ', transliteration: 'Ar-Razzaq', meaning: 'The Provider', reflection: 'He sustains every living thing.' },
  { number: 18, arabic: 'الْفَتَّاحُ', transliteration: 'Al-Fattah', meaning: 'The Opener', reflection: 'He opens doors of guidance and provision.' },
  { number: 19, arabic: 'الْعَلِيمُ', transliteration: 'Al-Alim', meaning: 'The All-Knowing', reflection: 'Nothing is hidden from His knowledge.' },
  { number: 20, arabic: 'الْقَابِضُ', transliteration: 'Al-Qabid', meaning: 'The Withholder', reflection: 'He withholds with wisdom and justice.' },
  { number: 21, arabic: 'الْبَاسِطُ', transliteration: 'Al-Basit', meaning: 'The Expander', reflection: 'He expands provision and hearts.' },
  { number: 22, arabic: 'الْخَافِضُ', transliteration: 'Al-Khafid', meaning: 'The Abaser', reflection: 'He lowers whom He wills with justice.' },
  { number: 23, arabic: 'الرَّافِعُ', transliteration: 'Ar-Rafi', meaning: 'The Exalter', reflection: 'He raises those who turn to Him.' },
  { number: 24, arabic: 'الْمُعِزُّ', transliteration: 'Al-Mu’izz', meaning: 'The Honorer', reflection: 'True honor is granted by Him.' },
  { number: 25, arabic: 'الْمُذِلُّ', transliteration: 'Al-Mudhill', meaning: 'The Humiliator', reflection: 'He humbles arrogance with truth.' },
  { number: 26, arabic: 'السَّمِيعُ', transliteration: 'As-Sami', meaning: 'The All-Hearing', reflection: 'He hears every word and whisper.' },
  { number: 27, arabic: 'الْبَصِيرُ', transliteration: 'Al-Basir', meaning: 'The All-Seeing', reflection: 'He sees every deed and intention.' },
  { number: 28, arabic: 'الْحَكَمُ', transliteration: 'Al-Hakam', meaning: 'The Judge', reflection: 'His judgment is perfect and final.' },
  { number: 29, arabic: 'الْعَدْلُ', transliteration: 'Al-Adl', meaning: 'The Just', reflection: 'Absolute fairness without oppression.' },
  { number: 30, arabic: 'اللَّطِيفُ', transliteration: 'Al-Latif', meaning: 'The Subtle', reflection: 'Gentle kindness in ways we may not see.' },
  { number: 31, arabic: 'الْخَبِيرُ', transliteration: 'Al-Khabir', meaning: 'The All-Aware', reflection: 'Fully aware of every inner reality.' },
  { number: 32, arabic: 'الْحَلِيمُ', transliteration: 'Al-Halim', meaning: 'The Forbearing', reflection: 'He delays punishment with mercy.' },
  { number: 33, arabic: 'الْعَظِيمُ', transliteration: 'Al-Azim', meaning: 'The Magnificent', reflection: 'Beyond every measure of greatness.' },
  { number: 34, arabic: 'الْغَفُورُ', transliteration: 'Al-Ghafur', meaning: 'The Forgiving', reflection: 'He forgives extensively and completely.' },
  { number: 35, arabic: 'الشَّكُورُ', transliteration: 'Ash-Shakur', meaning: 'The Appreciative', reflection: 'He multiplies the reward of small deeds.' },
  { number: 36, arabic: 'الْعَلِيُّ', transliteration: 'Al-Ali', meaning: 'The Most High', reflection: 'Exalted above all creation.' },
  { number: 37, arabic: 'الْكَبِيرُ', transliteration: 'Al-Kabir', meaning: 'The Most Great', reflection: 'Greater than every greatness we know.' },
  { number: 38, arabic: 'الْحَفِيظُ', transliteration: 'Al-Hafiz', meaning: 'The Preserver', reflection: 'He guards and protects.' },
  { number: 39, arabic: 'الْمُقِيتُ', transliteration: 'Al-Muqit', meaning: 'The Sustainer', reflection: 'He nourishes bodies and hearts.' },
  { number: 40, arabic: 'الْحَسِيبُ', transliteration: 'Al-Hasib', meaning: 'The Reckoner', reflection: 'Sufficient as the One who takes account.' },
  { number: 41, arabic: 'الْجَلِيلُ', transliteration: 'Al-Jalil', meaning: 'The Majestic', reflection: 'Majesty and awe belong to Him.' },
  { number: 42, arabic: 'الْكَرِيمُ', transliteration: 'Al-Karim', meaning: 'The Generous', reflection: 'Boundless nobility and generosity.' },
  { number: 43, arabic: 'الرَّقِيبُ', transliteration: 'Ar-Raqib', meaning: 'The Watchful', reflection: 'Ever watchful over His servants.' },
  { number: 44, arabic: 'الْمُجِيبُ', transliteration: 'Al-Mujib', meaning: 'The Responsive', reflection: 'He answers the call of those who ask.' },
  { number: 45, arabic: 'الْوَاسِعُ', transliteration: 'Al-Wasi', meaning: 'The Vast', reflection: 'His mercy and knowledge are boundless.' },
  { number: 46, arabic: 'الْحَكِيمُ', transliteration: 'Al-Hakim', meaning: 'The Wise', reflection: 'Every decree carries perfect wisdom.' },
  { number: 47, arabic: 'الْوَدُودُ', transliteration: 'Al-Wadud', meaning: 'The Loving', reflection: 'He loves and is loved with pure affection.' },
  { number: 48, arabic: 'الْمَجِيدُ', transliteration: 'Al-Majid', meaning: 'The Glorious', reflection: 'Glorious in attributes and actions.' },
  { number: 49, arabic: 'الْبَاعِثُ', transliteration: 'Al-Ba’ith', meaning: 'The Resurrector', reflection: 'He raises the dead to account.' },
  { number: 50, arabic: 'الشَّهِيدُ', transliteration: 'Ash-Shahid', meaning: 'The Witness', reflection: 'Witness to every hidden and open deed.' },
  { number: 51, arabic: 'الْحَقُّ', transliteration: 'Al-Haqq', meaning: 'The Truth', reflection: 'The ultimate Reality and Truth.' },
  { number: 52, arabic: 'الْوَكِيلُ', transliteration: 'Al-Wakil', meaning: 'The Trustee', reflection: 'Worthy of complete reliance.' },
  { number: 53, arabic: 'الْقَوِيُّ', transliteration: 'Al-Qawiyy', meaning: 'The Strong', reflection: 'Perfect strength without fatigue.' },
  { number: 54, arabic: 'الْمَتِينُ', transliteration: 'Al-Matin', meaning: 'The Firm', reflection: 'Unshakeable and enduring power.' },
  { number: 55, arabic: 'الْوَلِيُّ', transliteration: 'Al-Waliyy', meaning: 'The Protecting Friend', reflection: 'A protecting ally to the believers.' },
  { number: 56, arabic: 'الْحَمِيدُ', transliteration: 'Al-Hamid', meaning: 'The Praiseworthy', reflection: 'Deserving of all praise always.' },
  { number: 57, arabic: 'الْمُحْصِي', transliteration: 'Al-Muhsi', meaning: 'The Counter', reflection: 'He enumerates every detail perfectly.' },
  { number: 58, arabic: 'الْمُبْدِئُ', transliteration: 'Al-Mubdi', meaning: 'The Initiator', reflection: 'He begins creation from nothing.' },
  { number: 59, arabic: 'الْمُعِيدُ', transliteration: 'Al-Mu’id', meaning: 'The Restorer', reflection: 'He returns creation after it ends.' },
  { number: 60, arabic: 'الْمُحْيِي', transliteration: 'Al-Muhyi', meaning: 'The Giver of Life', reflection: 'He grants life to the dead and the hearts.' },
  { number: 61, arabic: 'الْمُمِيتُ', transliteration: 'Al-Mumit', meaning: 'The Taker of Life', reflection: 'Death is by His decree alone.' },
  { number: 62, arabic: 'الْحَيُّ', transliteration: 'Al-Hayy', meaning: 'The Ever-Living', reflection: 'Eternal life without death or sleep.' },
  { number: 63, arabic: 'الْقَيُّومُ', transliteration: 'Al-Qayyum', meaning: 'The Self-Sustaining', reflection: 'He sustains all while needing none.' },
  { number: 64, arabic: 'الْوَاجِدُ', transliteration: 'Al-Wajid', meaning: 'The Finder', reflection: 'Nothing escapes His finding.' },
  { number: 65, arabic: 'الْمَاجِدُ', transliteration: 'Al-Maajid', meaning: 'The Noble', reflection: 'Noble in essence and generosity.' },
  { number: 66, arabic: 'الْوَاحِدُ', transliteration: 'Al-Wahid', meaning: 'The One', reflection: 'One without partner or equal.' },
  { number: 67, arabic: 'الْأَحَدُ', transliteration: 'Al-Ahad', meaning: 'The Unique', reflection: 'Absolutely unique and indivisible.' },
  { number: 68, arabic: 'الصَّمَدُ', transliteration: 'As-Samad', meaning: 'The Eternal Refuge', reflection: 'All turn to Him; He needs none.' },
  { number: 69, arabic: 'الْقَادِرُ', transliteration: 'Al-Qadir', meaning: 'The Able', reflection: 'Able to do all that He wills.' },
  { number: 70, arabic: 'الْمُقْتَدِرُ', transliteration: 'Al-Muqtadir', meaning: 'The Powerful', reflection: 'Perfect power over every affair.' },
  { number: 71, arabic: 'الْمُقَدِّمُ', transliteration: 'Al-Muqaddim', meaning: 'The Expediter', reflection: 'He brings forward whom He wills.' },
  { number: 72, arabic: 'الْمُؤَخِّرُ', transliteration: 'Al-Mu’akhkhir', meaning: 'The Delayer', reflection: 'He delays with perfect wisdom.' },
  { number: 73, arabic: 'الْأَوَّلُ', transliteration: 'Al-Awwal', meaning: 'The First', reflection: 'Nothing precedes Him.' },
  { number: 74, arabic: 'الْآخِرُ', transliteration: 'Al-Akhir', meaning: 'The Last', reflection: 'Nothing remains after Him.' },
  { number: 75, arabic: 'الظَّاهِرُ', transliteration: 'Az-Zahir', meaning: 'The Manifest', reflection: 'Evident through His signs.' },
  { number: 76, arabic: 'الْبَاطِنُ', transliteration: 'Al-Batin', meaning: 'The Hidden', reflection: 'Hidden from sight, known by signs.' },
  { number: 77, arabic: 'الْوَالِي', transliteration: 'Al-Wali', meaning: 'The Governor', reflection: 'He governs every affair.' },
  { number: 78, arabic: 'الْمُتَعَالِي', transliteration: 'Al-Muta’ali', meaning: 'The Most Exalted', reflection: 'Exalted above every deficiency.' },
  { number: 79, arabic: 'الْبَرُّ', transliteration: 'Al-Barr', meaning: 'The Kind', reflection: 'Immense kindness and righteousness.' },
  { number: 80, arabic: 'التَّوَّابُ', transliteration: 'At-Tawwab', meaning: 'The Accepter of Repentance', reflection: 'He turns to those who turn to Him.' },
  { number: 81, arabic: 'الْمُنْتَقِمُ', transliteration: 'Al-Muntaqim', meaning: 'The Avenger', reflection: 'He takes justice for the oppressed.' },
  { number: 82, arabic: 'الْعَفُوُّ', transliteration: 'Al-Afuww', meaning: 'The Pardoner', reflection: 'He erases sins completely.' },
  { number: 83, arabic: 'الرَّءُوفُ', transliteration: 'Ar-Ra’uf', meaning: 'The Compassionate', reflection: 'Deep compassion beyond measure.' },
  { number: 84, arabic: 'مَالِكُ الْمُلْكِ', transliteration: 'Malik-ul-Mulk', meaning: 'Owner of All Sovereignty', reflection: 'Kingship of the heavens and earth.' },
  { number: 85, arabic: 'ذُو الْجَلَالِ وَالْإِكْرَامِ', transliteration: 'Dhul-Jalali wal-Ikram', meaning: 'Lord of Majesty and Generosity', reflection: 'Majesty paired with noble generosity.' },
  { number: 86, arabic: 'الْمُقْسِطُ', transliteration: 'Al-Muqsit', meaning: 'The Equitable', reflection: 'He establishes justice with balance.' },
  { number: 87, arabic: 'الْجَامِعُ', transliteration: 'Al-Jami', meaning: 'The Gatherer', reflection: 'He gathers creation for the final day.' },
  { number: 88, arabic: 'الْغَنِيُّ', transliteration: 'Al-Ghani', meaning: 'The Self-Sufficient', reflection: 'Free of all need; all need Him.' },
  { number: 89, arabic: 'الْمُغْنِي', transliteration: 'Al-Mughni', meaning: 'The Enricher', reflection: 'He enriches whom He wills.' },
  { number: 90, arabic: 'الْمَانِعُ', transliteration: 'Al-Mani', meaning: 'The Preventer', reflection: 'He withholds harm and grants barriers.' },
  { number: 91, arabic: 'الضَّارُّ', transliteration: 'Ad-Darr', meaning: 'The Afflicter', reflection: 'Harm and trial are by His wisdom.' },
  { number: 92, arabic: 'النَّافِعُ', transliteration: 'An-Nafi', meaning: 'The Benefactor', reflection: 'Every benefit comes from Him.' },
  { number: 93, arabic: 'النُّورُ', transliteration: 'An-Nur', meaning: 'The Light', reflection: 'Light of the heavens and the earth.' },
  { number: 94, arabic: 'الْهَادِي', transliteration: 'Al-Hadi', meaning: 'The Guide', reflection: 'He guides hearts to the straight path.' },
  { number: 95, arabic: 'الْبَدِيعُ', transliteration: 'Al-Badi', meaning: 'The Incomparable Originator', reflection: 'Creates without prior example.' },
  { number: 96, arabic: 'الْبَاقِي', transliteration: 'Al-Baqi', meaning: 'The Everlasting', reflection: 'He remains when all else perishes.' },
  { number: 97, arabic: 'الْوَارِثُ', transliteration: 'Al-Warith', meaning: 'The Inheritor', reflection: 'All returns to Him in the end.' },
  { number: 98, arabic: 'الرَّشِيدُ', transliteration: 'Ar-Rashid', meaning: 'The Guide to Right Conduct', reflection: 'He directs to mature, sound guidance.' },
  { number: 99, arabic: 'الصَّبُورُ', transliteration: 'As-Sabur', meaning: 'The Patient', reflection: 'Perfect patience with His creation.' },
];

if (divineNames.length !== 99) {
  throw new Error(`Expected 99 divine names, received ${divineNames.length}`);
}

export function findName(query: string): DivineName[] {
  const q = query.trim().toLowerCase();
  if (!q) return divineNames;
  return divineNames.filter(
    (name) =>
      name.transliteration.toLowerCase().includes(q) ||
      name.meaning.toLowerCase().includes(q) ||
      name.arabic.includes(query.trim()) ||
      String(name.number) === q,
  );
}
