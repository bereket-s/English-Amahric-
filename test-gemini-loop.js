const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  console.log('Testing Gemini 2.5 Flash API with multiple delayed requests...')
  
  const chunks = [
    `chunk 1: AM: አማካኝነት የሚተላለፉ በሽታዎች ጨብጥ፣ ክላሜዲያ... stroke (CVA) ስትሮክ (ሲቪኤ)...`,
    `chunk 2: subscriber ተመዝጋቢዎች... TB (Tuberculosis) ሳንባ ነቀርሳ (ቲቢ)...`,
    `chunk 3: EN: Have you ever had a STD... My father suffered a stroke last year...`
  ];

  for(let i=0; i<chunks.length; i++) {
    console.log(`Sending chunk ${i+1}...`);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract EVERY medical terminology glossary entry. Return JSON array. Raw text: ${chunks[i]}`,
        config: { temperature: 0.0, responseMimeType: 'application/json' }
      });
      console.log(`Response ${i+1} OK:`, response.text ? 'Got JSON' : 'Empty');
    } catch(e) {
      console.error(`Chunk ${i+1} failed:`, e.status, e.message);
    }
    
    if (i < chunks.length - 1) {
      console.log('Waiting 5s...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
run();
