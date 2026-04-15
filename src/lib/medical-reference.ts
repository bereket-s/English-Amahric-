export type ReferenceItem = {
  english: string;
  amharic: string;
  phonetic?: string;
  category?: string;
  examples?: string;
};

export const PAIN_DESCRIPTORS: ReferenceItem[] = [
  { english: 'Throbbing', amharic: 'የሚቆረጥም / የሚመታ', phonetic: 'Yemikoretim / Yemimeta' },
  { english: 'Sharp', amharic: 'ስለት ያለው / የሚወጋ', phonetic: 'Silet Yalew / Yemiwega' },
  { english: 'Stabbing/Piercing', amharic: 'የሚወጋ', phonetic: 'Yemiwega' },
  { english: 'Dull', amharic: 'ደንዘዝ ያለ', phonetic: 'Denzez Yale' },
  { english: 'Burning', amharic: 'የሚያቃጥል', phonetic: 'Yemiakatil' },
  { english: 'Aching', amharic: 'የሚያም', phonetic: 'Yemiyam' },
  { english: 'Cramping', amharic: 'የሚወጥር / የሚጨብጥ', phonetic: 'Yemiwetir / Yemichebit' },
  { english: 'Radiating', amharic: 'የሚሰራጭ', phonetic: 'Yemiserach' },
  { english: 'Constant', amharic: 'የማያቋርጥ', phonetic: 'Yemayakwarit' },
  { english: 'Intermittent', amharic: 'መጥቶ የሚጠፋ / አልፎ አልፎ', phonetic: 'Meto Yemitefa / Alfo Alfo' },
];

export const COMMON_MEDICINES: ReferenceItem[] = [
  { english: 'Painkillers (Analgesics)', amharic: 'የህመም ማስታገሻ', phonetic: 'Ye Himem Mastagesha', category: 'General', examples: 'Tylenol (Acetaminophen), Advil/Motrin (Ibuprofen), Aleve (Naproxen)' },
  { english: 'Antibiotics', amharic: 'ፀረ-ባክቴሪያ / አንቲባዮቲክ', phonetic: 'Tsere-Bacteria', category: 'Infection', examples: 'Amoxil (Amoxicillin), Zithromax (Azithromycin), Cipro (Ciprofloxacin), Augmentin' },
  { english: 'Antihypertensives (BP Meds)', amharic: 'የደም ግፊት መድሀኒት', phonetic: 'Ye Dem Gifit Medhanit', category: 'Cardiovascular', examples: 'Prinivil/Zestril (Lisinopril), Norvasc (Amlodipine), Cozaar (Losartan)' },
  { english: 'Antidiabetics', amharic: 'የስኳር በሽታ መድሀኒት', phonetic: 'Ye Skuwar Beshita Medhanit', category: 'Endocrine', examples: 'Glucophage (Metformin), Lantus (Insulin glargine), Januvia (Sitagliptin)' },
  { english: 'Antacids', amharic: 'የጨጓራ አሲድ ማስታገሻ', phonetic: 'Ye Cheguara Acid Mastagesha', category: 'Gastrointestinal', examples: 'Prilosec (Omeprazole), Nexium (Esomeprazole), Tums, Pepcid (Famotidine)' },
  { english: 'Antihistamines (Allergy meds)', amharic: 'የአለርጂ መድሀኒት', phonetic: 'Ye Allerji Medhanit', category: 'Allergy', examples: 'Zyrtec (Cetirizine), Claritin (Loratadine), Benadryl (Diphenhydramine), Allegra' },
  { english: 'Anticoagulants (Blood thinners)', amharic: 'ደም ማቅጠኛ', phonetic: 'Dem Maktegna', category: 'Cardiovascular', examples: 'Coumadin (Warfarin), Eliquis (Apixaban), Xarelto (Rivaroxaban), Plavix (Clopidogrel)' },
  { english: 'Asthma Inhalers (Bronchodilators)', amharic: 'የአስም መተንፈሻ', phonetic: 'Ye Asim Metenfesha', category: 'Respiratory', examples: 'ProAir/Ventolin (Albuterol), Symbicort, Advair Diskus' },
  { english: 'Antidepressants', amharic: 'የድብርት መድሀኒት', phonetic: 'Ye Dibirt Medhanit', category: 'Psychiatric', examples: 'Zoloft (Sertraline), Prozac (Fluoxetine), Lexapro (Escitalopram)' },
  { english: 'IV Fluids', amharic: 'የደም ስር ፈሳሽ / ድሪፕ', phonetic: 'Ye Dem Sir Fesash / Drip', category: 'General', examples: 'Normal Saline (NS), Lactated Ringer\'s (LR), D5W' },
];

export const ANATOMY: ReferenceItem[] = [
  { english: 'Head', amharic: 'ራስ / ጭንቅላት', phonetic: 'Ras / Chinklat' },
  { english: 'Chest', amharic: 'ደረት', phonetic: 'Deret' },
  { english: 'Heart', amharic: 'ልብ', phonetic: 'Lib' },
  { english: 'Lungs', amharic: 'ሳንባ', phonetic: 'Sanba' },
  { english: 'Stomach / Abdomen', amharic: 'ሆድ / ጨጓራ', phonetic: 'Hod / Cheguara' },
  { english: 'Kidneys', amharic: 'ኩላሊት', phonetic: 'Kulalit' },
  { english: 'Liver', amharic: 'ጉበት', phonetic: 'Gubet' },
  { english: 'Spine / Back', amharic: 'አከርካሪ / ጀርባ', phonetic: 'Akerkari / Jerba' },
  { english: 'Joints', amharic: 'መገጣጠሚያ', phonetic: 'Megetatemiya' },
  { english: 'Veins / Tendons', amharic: 'ጅማት / የደም ስር', phonetic: 'Jimat / Ye Dem Sir' },
];

export const VITAL_SIGNS_AND_PHRASES: ReferenceItem[] = [
  { english: 'Blood Pressure', amharic: 'የደም ግፊት', phonetic: 'Ye Dem Gifit' },
  { english: 'Heart Rate / Pulse', amharic: 'የልብ ምት', phonetic: 'Ye Lib Mit' },
  { english: 'Temperature', amharic: 'የሰውነት ሙቀት / ትኩሳት', phonetic: 'Ye Sewnet Muket / Tikusat' },
  { english: 'Breathing / Respiration', amharic: 'አተነፋፈስ', phonetic: 'Atenefafes' },
  { english: 'Are you allergic to any medication?', amharic: 'ለማንኛውም መድሀኒት አለርጂ ነዎት?', phonetic: 'Le Manignawim Medhanit Allerji Newot?' },
  { english: 'Take a deep breath', amharic: 'በጥልቀት ይተንፍሱ', phonetic: 'Be Tilket Yitenfisu' },
  { english: 'Show me where it hurts', amharic: 'የት ቦታ እንደሚያምዎ ያሳዩኝ', phonetic: 'Yet Bota Endemiyamwo Yasayugn' },
  { english: 'On a scale of 1 to 10...', amharic: 'ከአንድ እስከ አስር ባለው መለኪያ...', phonetic: 'Ke And Eske Asir Balew Melekiya...' },
];
