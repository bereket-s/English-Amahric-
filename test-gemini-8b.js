const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  console.log('Testing Gemini 1.5 Flash 8B API...')
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-8b',
      contents: `Extract EVERY glossary entry you can find from the following medical English-Amharic PDF text.

Return a JSON array of objects with exactly these fields:
- "english_term": English medical noun/noun phrase (required, capitalized)
- "amharic_term": Amharic translation (string or null)
- "english_sentence": Sample sentence in English (string or null)
- "amharic_sentence": Amharic translation of sample sentence (string or null)
- "topic": Medical specialty (Cardiology, Pediatrics, Surgery, etc.)
- "level": Difficulty level. Default: "L3"

RULES:
- Return ONLY the raw JSON array. Do not use markdown fences like \`\`\`json.
- "english_term" must be a noun phrase only, never a sentence fragment.
- A dash "—" means the field is empty → set to null
- Amharic uses Ethiopic script (ሀ-ፐ range).

Raw text:
AM: አማካኝነት የሚተላለፉ በሽታዎች ጨብጥ፣ ክላሜዲያ፣ የመራቢያ አካላት ኪንታሮት ወይም ሄርፕስን የመሳሰሉ በግብረስጋ አማካኝነት የሚተላለፉ በሽታዎች ይዘዎት ያውቃሉ? stroke (CVA) ስትሮክ (ሲቪኤ) A stroke occurs when blood flow is አባቴ ባለፈው ዓመት ስትሮክ መትቶት የነበረ ሲሆን እስከአሁን የመራመድ እና የማውራት ችግር አለበት ነገር ግን በሚቀጥል ህክምና ቀስ በቀስ ማገገም አለበት፡፡ subscriber ተመዝጋቢዎች A person who receives a service or coverage አንዳንድ ትልልቅ ኩባንያዎች የኢ-ሜይል ተመዝጋቢዎቻቸውን ዝርዝር ለሦስተኛ አካል አይሸጡም፣ በሊዝ አይሰጡም ወይም አያከራዩም፡፡ TB (Tuberculosis) ሳንባ ነቀርሳ (ቲቢ) A disease caused by bacteria called የቲቢው የቆዳ ምርመራ ፖዘቲቭ በመሆኑ የደረት ራጅ ማዘዝ ያስፈልገናል፡፡ EN: Have you ever had a STD, such as gonorrhea, chlamydia, genital warts or herpes? interrupted to part of the brain. Without blood to supply oxygen and nutrients and to remove waste products, brain cells quickly begin to die. Depending on the region of the brain affected, a stroke may cause paralysis, speech impairment, loss of memory and reasoning ability, coma, or death. A stroke also is sometimes called a brain attack or a cerebrovascular accident (CVA). My father suffered a stroke last year and still has difficulty walking and speaking, but with continued therapy he should improve slowly. regularly by paying in advance. Some large companies will not sell, lease or rent it's email subscriber list to third parties. Mycobacterium tuberculosis. The bacteria usually attack the lungs, but they can also damage other parts of the body. As the TB skin test result is positive, we will need to order a chest x-ray.`,
      config: {
        temperature: 0.0,
        responseMimeType: 'application/json',
      }
    });
    console.log('Response:', response.text);
  } catch(e) {
    console.error('Gemini error:', Object.keys(e), e.status, e.message);
  }
}
run();
