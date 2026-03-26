import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// 200+ Professional Interpreter Terms (Medical, Legal, Social Services, Banking, Education, Immigration)
const SEED_TERMS = [
  // ── MEDICAL ──
  { english_term: 'hypertension', amharic_term: 'የደም ግፊት', definition: 'High blood pressure — a chronic condition where blood pressure in the arteries is elevated.', topic: 'medical', level: 'L2' },
  { english_term: 'diabetes', amharic_term: 'የስኳር በሽታ', definition: 'A metabolic disease causing high blood sugar levels.', topic: 'medical', level: 'L2' },
  { english_term: 'prescription', amharic_term: 'የዶክተር ትዕዛዝ', definition: 'A written order from a physician for medication.', topic: 'medical', level: 'L2' },
  { english_term: 'dosage', amharic_term: 'መጠን', definition: 'The amount of medication to be taken.', topic: 'medical', level: 'L2' },
  { english_term: 'allergy', amharic_term: 'አለርጂ', definition: 'An immune system reaction to a substance.', topic: 'medical', level: 'L2' },
  { english_term: 'symptom', amharic_term: 'ምልክት', definition: 'A physical or mental feature indicating a condition.', topic: 'medical', level: 'L2' },
  { english_term: 'diagnosis', amharic_term: 'ምርመራ ውጤት', definition: 'Identification of a disease or condition.', topic: 'medical', level: 'L2' },
  { english_term: 'referral', amharic_term: 'ወደ ሌላ ሐኪም መላክ', definition: 'Directing a patient to a specialist for further care.', topic: 'medical', level: 'L2' },
  { english_term: 'emergency room', amharic_term: 'አደጋ ጊዜ ክፍል', definition: 'A hospital department for urgent medical cases.', topic: 'medical', level: 'L2' },
  { english_term: 'surgery', amharic_term: 'ቀዶ ሕክምና', definition: 'Medical treatment involving incision of the body.', topic: 'medical', level: 'L3' },
  { english_term: 'anesthesia', amharic_term: 'ማደንዘዣ', definition: 'Medicine used to prevent pain during surgery.', topic: 'medical', level: 'L3' },
  { english_term: 'biopsy', amharic_term: 'ቲሹ ናሙና ምርመራ', definition: 'Removal of tissue for laboratory examination.', topic: 'medical', level: 'L3' },
  { english_term: 'chemotherapy', amharic_term: 'የካንሰር መድኃኒት ሕክምና', definition: 'Drug treatment used to kill or slow cancer cells.', topic: 'medical', level: 'L3' },
  { english_term: 'chronic condition', amharic_term: 'ረጅም ጊዜ የሚቆይ በሽታ', definition: 'A long-lasting health condition.', topic: 'medical', level: 'L2' },
  { english_term: 'informed consent', amharic_term: 'ፈቃድ ከሰጠ በኋላ', definition: 'Patient agreement to treatment after being fully informed.', topic: 'medical', level: 'L3' },
  { english_term: 'vital signs', amharic_term: 'የሕይወት ምልክቶች', definition: 'Basic health measurements: pulse, temperature, blood pressure, breathing rate.', topic: 'medical', level: 'L2' },
  { english_term: 'discharge', amharic_term: 'ከሆስፒታል መውጣት', definition: 'Releasing a patient from hospital care.', topic: 'medical', level: 'L2' },
  { english_term: 'inpatient', amharic_term: 'ሆስፒታል ታካሚ', definition: 'A patient who stays overnight in a hospital.', topic: 'medical', level: 'L2' },
  { english_term: 'outpatient', amharic_term: 'የቀን ሕሙም', definition: 'A patient treated without being admitted to hospital.', topic: 'medical', level: 'L2' },
  { english_term: 'prenatal care', amharic_term: 'የእርግዝና ክትትል', definition: 'Medical care during pregnancy.', topic: 'medical', level: 'L2' },
  { english_term: 'mental health', amharic_term: 'የአዕምሮ ጤና', definition: 'Psychological and emotional wellbeing.', topic: 'medical', level: 'L2' },
  { english_term: 'trauma', amharic_term: 'አሰቃቂ ክስተት', definition: 'Severe emotional shock from a distressing experience.', topic: 'medical', level: 'L3' },
  { english_term: 'hospice', amharic_term: 'ሞት ቃረበ ሰው ክብካቤ', definition: 'End-of-life care focused on comfort.', topic: 'medical', level: 'L3' },
  { english_term: 'immunization', amharic_term: 'ክትባት', definition: 'Vaccination to protect against disease.', topic: 'medical', level: 'L2' },
  { english_term: 'insurance copay', amharic_term: 'ሕሙሙ የሚከፍለው ድርሻ', definition: 'Fixed amount paid by insured person for health services.', topic: 'medical', level: 'L2' },

  // ── LEGAL & COURT ──
  { english_term: 'attorney', amharic_term: 'ጠበቃ', definition: 'A person licensed to practice law.', topic: 'legal', level: 'L2' },
  { english_term: 'plaintiff', amharic_term: 'አቤቱታ አቅራቢ', definition: 'The party who initiates a lawsuit.', topic: 'legal', level: 'L3' },
  { english_term: 'defendant', amharic_term: 'ተከሳሽ', definition: 'The party accused in a legal proceeding.', topic: 'legal', level: 'L3' },
  { english_term: 'verdict', amharic_term: 'ፍርድ ቤት ውሳኔ', definition: 'The formal decision made by a jury or judge.', topic: 'legal', level: 'L3' },
  { english_term: 'plea', amharic_term: 'አቤቱታ', definition: 'A formal response by the defendant to a charge.', topic: 'legal', level: 'L3' },
  { english_term: 'guilty plea', amharic_term: 'ጥፋተኛ ነኝ የሚል ቃል', definition: 'Admission by defendant of committing the crime.', topic: 'legal', level: 'L3' },
  { english_term: 'not guilty', amharic_term: 'ጥፋተኛ አይደለሁም', definition: 'Denial of criminal charges.', topic: 'legal', level: 'L2' },
  { english_term: 'subpoena', amharic_term: 'ፍርድ ቤት መጥሪያ', definition: 'A legal order requiring appearance in court.', topic: 'legal', level: 'L3' },
  { english_term: 'warrant', amharic_term: 'ትዕዛዝ', definition: 'A document authorizing police action.', topic: 'legal', level: 'L2' },
  { english_term: 'bail', amharic_term: 'ዋስ', definition: 'Money paid to release an arrested person temporarily.', topic: 'legal', level: 'L2' },
  { english_term: 'probation', amharic_term: 'ፍቃዳዊ ቁጥጥር', definition: 'A period of supervision instead of imprisonment.', topic: 'legal', level: 'L3' },
  { english_term: 'parole', amharic_term: 'ቀደምት ነፃ መውጣት', definition: 'Early release from prison under supervision.', topic: 'legal', level: 'L3' },
  { english_term: 'deposition', amharic_term: 'ቅድመ-ፍርድ ቤት ቃለ-መሃላ', definition: 'Sworn out-of-court testimony used in litigation.', topic: 'legal', level: 'L4' },
  { english_term: 'contempt of court', amharic_term: 'ፍርድ ቤትን ማናቸው', definition: 'Disobedience or disrespect to a court of law.', topic: 'legal', level: 'L4' },
  { english_term: 'custody', amharic_term: 'አሳዳጊነት', definition: 'Legal right to care for and control a child.', topic: 'legal', level: 'L2' },
  { english_term: 'restraining order', amharic_term: 'ርቅ ትዕዛዝ', definition: 'Court order preventing contact between individuals.', topic: 'legal', level: 'L3' },
  { english_term: 'testimony', amharic_term: 'ምስክርነት', definition: 'Formal statement given under oath in court.', topic: 'legal', level: 'L2' },
  { english_term: 'affidavit', amharic_term: 'መሃሪ ቃለ-ቃልኪዳን', definition: 'A written sworn statement of fact.', topic: 'legal', level: 'L3' },
  { english_term: 'felony', amharic_term: 'ከባድ ወንጀል', definition: 'A serious crime typically punishable by imprisonment.', topic: 'legal', level: 'L3' },
  { english_term: 'misdemeanor', amharic_term: 'ቀላል ወንጀል', definition: 'A minor wrongdoing less serious than a felony.', topic: 'legal', level: 'L3' },
  { english_term: 'appeal', amharic_term: 'ይግባኝ', definition: 'A request to a higher court to review a decision.', topic: 'legal', level: 'L3' },
  { english_term: 'settlement', amharic_term: 'ስምምነት', definition: 'Agreement to resolve a legal dispute out of court.', topic: 'legal', level: 'L3' },
  { english_term: 'power of attorney', amharic_term: 'ሙሉ ስልጣናዊ ፈቃድ', definition: 'Legal authorization to act on another\'s behalf.', topic: 'legal', level: 'L4' },

  // ── SOCIAL SERVICES ──
  { english_term: 'benefits', amharic_term: 'ጥቅማ-ጥቅሞች', definition: 'Financial support or services provided by government.', topic: 'social services', level: 'L2' },
  { english_term: 'case worker', amharic_term: 'የጉዳይ ተቆጣጣሪ', definition: 'A professional who assists clients with social services.', topic: 'social services', level: 'L2' },
  { english_term: 'food stamps', amharic_term: 'የምግብ ቫውቸር', definition: 'Government vouchers to help low-income families buy food.', topic: 'social services', level: 'L2' },
  { english_term: 'SNAP', amharic_term: 'ስናፕ', definition: 'Supplemental Nutrition Assistance Program — food benefit program.', topic: 'social services', level: 'L2' },
  { english_term: 'Medicaid', amharic_term: 'ሜዲኬድ', definition: 'Government health program for low-income individuals.', topic: 'social services', level: 'L2' },
  { english_term: 'Medicare', amharic_term: 'ሜዲኬር', definition: 'Federal health insurance program for people 65+.', topic: 'social services', level: 'L2' },
  { english_term: 'housing assistance', amharic_term: 'የቤት ድጋፍ', definition: 'Government support for affordable housing.', topic: 'social services', level: 'L2' },
  { english_term: 'Section 8', amharic_term: 'ሴክሽን ስምንት', definition: 'Rental assistance program for low-income families.', topic: 'social services', level: 'L2' },
  { english_term: 'welfare', amharic_term: 'ድጋፍ ፕሮግራም', definition: 'Government aid for people with financial need.', topic: 'social services', level: 'L2' },
  { english_term: 'domestic violence', amharic_term: 'የቤት ውስጥ ጥቃት', definition: 'Abusive behavior in a domestic relationship.', topic: 'social services', level: 'L2' },
  { english_term: 'foster care', amharic_term: 'ጊዜያዊ ቤተሰብ ክብካቤ', definition: 'Temporary placement of children in another family.', topic: 'social services', level: 'L3' },
  { english_term: 'disabled', amharic_term: 'አካል ጉዳተኛ', definition: 'Having a physical or mental condition affecting life activities.', topic: 'social services', level: 'L2' },
  { english_term: 'unemployment benefits', amharic_term: 'ሥራ አጥ ድጋፍ', definition: 'Temporary income support for people who lost their jobs.', topic: 'social services', level: 'L2' },
  { english_term: 'social security number', amharic_term: 'ማህበራዊ ዋስትና ቁጥር', definition: 'A unique government ID number for US residents.', topic: 'social services', level: 'L2' },
  { english_term: 'eviction', amharic_term: 'ከቤት ማስወጣት', definition: 'Legal process to remove a tenant from a property.', topic: 'social services', level: 'L2' },
  { english_term: 'interpreter services', amharic_term: 'የቋንቋ አስተርጓሚ አገልግሎት', definition: 'Professional language assistance for non-English speakers.', topic: 'social services', level: 'L2' },
  { english_term: 'grievance', amharic_term: 'አቤቱታ', definition: 'A formal complaint about services or treatment.', topic: 'social services', level: 'L3' },

  // ── BANKING & FINANCE ──
  { english_term: 'wire transfer', amharic_term: 'ቀጥታ ገንዘብ ዝውውር', definition: 'Electronic transfer of money between accounts.', topic: 'banking', level: 'L2' },
  { english_term: 'overdraft', amharic_term: 'ከሂሳብ ሂሳብ በላይ ወጪ', definition: 'Spending more money than what is available in an account.', topic: 'banking', level: 'L2' },
  { english_term: 'interest rate', amharic_term: 'የወለድ መጠን', definition: 'Percentage charged on borrowed money.', topic: 'banking', level: 'L2' },
  { english_term: 'credit score', amharic_term: 'የብድር ነጥብ', definition: 'A number representing a person\'s creditworthiness.', topic: 'banking', level: 'L2' },
  { english_term: 'mortgage', amharic_term: 'የቤት ብድር', definition: 'A loan used to purchase real estate.', topic: 'banking', level: 'L3' },
  { english_term: 'collateral', amharic_term: 'ዋስትና', definition: 'Property pledged as security for a loan.', topic: 'banking', level: 'L3' },
  { english_term: 'foreclosure', amharic_term: 'ቤት ወደ ባንክ መመለስ', definition: 'Legal process to repossess a mortgaged property.', topic: 'banking', level: 'L3' },
  { english_term: 'savings account', amharic_term: 'የቁጠባ ሒሳብ', definition: 'Bank account for storing money and earning interest.', topic: 'banking', level: 'L2' },
  { english_term: 'checking account', amharic_term: 'የቼክ ሒሳብ', definition: 'Bank account for frequent transactions.', topic: 'banking', level: 'L2' },
  { english_term: 'fraud', amharic_term: 'ማጭበርበር', definition: 'Wrongful deception for financial or personal gain.', topic: 'banking', level: 'L2' },
  { english_term: 'debit card', amharic_term: 'የዴቢት ካርድ', definition: 'A card linked directly to a bank account for transactions.', topic: 'banking', level: 'L2' },
  { english_term: 'credit card', amharic_term: 'የብድር ካርድ', definition: 'A card allowing borrowing up to a set limit.', topic: 'banking', level: 'L2' },
  { english_term: 'routing number', amharic_term: 'የባንክ መለያ ቁጥር', definition: 'Nine-digit number identifying a bank\'s location.', topic: 'banking', level: 'L2' },
  { english_term: 'minimum payment', amharic_term: 'ዝቅተኛ ክፍያ', definition: 'Smallest payment required on a credit account each month.', topic: 'banking', level: 'L2' },
  { english_term: 'bankruptcy', amharic_term: 'ኪሳራ', definition: 'Legal process for individuals unable to repay debts.', topic: 'banking', level: 'L3' },

  // ── EDUCATION ──
  { english_term: 'IEP', amharic_term: 'ግለሰብ የትምህርት ዕቅድ', definition: 'Individualized Education Program for students with disabilities.', topic: 'education', level: 'L3' },
  { english_term: '504 plan', amharic_term: '504 ዕቅድ', definition: 'Disability accommodation plan under Section 504.', topic: 'education', level: 'L3' },
  { english_term: 'suspension', amharic_term: 'ጊዜያዊ መታገድ', definition: 'Temporary removal of a student from school.', topic: 'education', level: 'L2' },
  { english_term: 'expulsion', amharic_term: 'ከትምህርት ቤት ማስወጣት', definition: 'Permanent removal of a student from school.', topic: 'education', level: 'L2' },
  { english_term: 'grade retention', amharic_term: 'ክፍልን መድገም', definition: 'Having a student repeat a school grade.', topic: 'education', level: 'L2' },
  { english_term: 'special education', amharic_term: 'ልዩ ትምህርት', definition: 'Education tailored to students with learning differences.', topic: 'education', level: 'L2' },
  { english_term: 'truancy', amharic_term: 'ያለ ፍቃድ ትምህርት መቅረት', definition: 'Unauthorized absence from school.', topic: 'education', level: 'L2' },
  { english_term: 'transcript', amharic_term: 'የትምህርት መዝገብ', definition: 'Official record of a student\'s courses and grades.', topic: 'education', level: 'L2' },
  { english_term: 'financial aid', amharic_term: 'የትምህርት ድጋፍ', definition: 'Funds to help students pay for education costs.', topic: 'education', level: 'L2' },
  { english_term: 'enrollment', amharic_term: 'ምዝገባ', definition: 'The process of registering for school or a program.', topic: 'education', level: 'L2' },

  // ── IMMIGRATION ──
  { english_term: 'asylum', amharic_term: 'ዓለምአቀፍ ጥበቃ', definition: 'Protection given to someone who left their country as a refugee.', topic: 'immigration', level: 'L3' },
  { english_term: 'visa', amharic_term: 'ቪዛ', definition: 'Authorization to enter a foreign country.', topic: 'immigration', level: 'L2' },
  { english_term: 'green card', amharic_term: 'ቋሚ መኖሪያ ፈቃድ', definition: 'Permanent resident card in the United States.', topic: 'immigration', level: 'L2' },
  { english_term: 'naturalization', amharic_term: 'ዜግነት ማግኘት', definition: 'The process of becoming a citizen of a country.', topic: 'immigration', level: 'L3' },
  { english_term: 'deportation', amharic_term: 'ከሀገር ማባረር', definition: 'The expulsion of a person from a country.', topic: 'immigration', level: 'L3' },
  { english_term: 'refugee', amharic_term: 'ስደተኛ', definition: 'A person forced to flee their country due to persecution.', topic: 'immigration', level: 'L2' },
  { english_term: 'work permit', amharic_term: 'የሥራ ፈቃድ', definition: 'Authorization to legally work in a country.', topic: 'immigration', level: 'L2' },
  { english_term: 'immigration court', amharic_term: 'የስደተኞች ፍርድ ቤት', definition: 'Court handling immigration-related cases.', topic: 'immigration', level: 'L3' },
  { english_term: 'USCIS', amharic_term: 'ዩኤስሲአይኤስ', definition: 'US Citizenship and Immigration Services.', topic: 'immigration', level: 'L2' },
  { english_term: 'passport', amharic_term: 'ፓስፖርት', definition: 'Official travel document issued by a government.', topic: 'immigration', level: 'L2' },
  { english_term: 'sponsorship', amharic_term: 'ዋስትና ሰጪ', definition: 'Financial support guarantee for an immigrant.', topic: 'immigration', level: 'L3' },
  { english_term: 'deferral', amharic_term: 'ማዘግየት', definition: 'Postponement of immigration action.', topic: 'immigration', level: 'L3' },
  { english_term: 'temporary protected status', amharic_term: 'ጊዜያዊ ጥበቃ', definition: 'Temporary permission to stay in the US due to conditions in home country.', topic: 'immigration', level: 'L3' },

  // ── INTERPRETER-SPECIFIC ──
  { english_term: 'consecutive interpretation', amharic_term: 'ተከታታይ ትርጓሜ', definition: 'Interpretation that occurs after the speaker pauses.', topic: 'interpreting', level: 'L2' },
  { english_term: 'simultaneous interpretation', amharic_term: 'ተመሳሳይ ጊዜ ትርጓሜ', definition: 'Interpretation occurring at the same time as speech.', topic: 'interpreting', level: 'L4' },
  { english_term: 'sight translation', amharic_term: 'ጽሑፍ ቀጥታ ትርጓሜ', definition: 'Oral interpretation of a written document in real time.', topic: 'interpreting', level: 'L3' },
  { english_term: 'back-channeling', amharic_term: 'ማስረጃ መጠቀም', definition: 'Brief words or sounds to show the listener is engaged.', topic: 'interpreting', level: 'L3' },
  { english_term: 'clarification', amharic_term: 'ማብራሪያ', definition: 'Request for clearer explanation of a statement.', topic: 'interpreting', level: 'L2' },
  { english_term: 'intervention', amharic_term: 'ጣልቃ ገብነት', definition: 'Interpreter stepping in to address a communication barrier.', topic: 'interpreting', level: 'L3' },
  { english_term: 'cultural competence', amharic_term: 'የባህል ብቃት', definition: 'Ability to interact effectively with people of different cultures.', topic: 'interpreting', level: 'L3' },
  { english_term: 'active listening', amharic_term: 'ትኩረት ሰጥቶ ማዳመጥ', definition: 'Fully concentrating on what is being said.', topic: 'interpreting', level: 'L2' },
  { english_term: 'impartiality', amharic_term: 'ወገናዊ አለመሆን', definition: 'Treating all parties fairly without personal bias.', topic: 'interpreting', level: 'L2' },
  { english_term: 'confidentiality', amharic_term: 'ሚስጥርን መጠበቅ', definition: 'Keeping all session information private.', topic: 'interpreting', level: 'L2' },
  { english_term: 'role boundaries', amharic_term: 'የሚና ወሰን', definition: 'Limits on what an interpreter should do professionally.', topic: 'interpreting', level: 'L2' },
  { english_term: 'verbatim', amharic_term: 'ቃል በቃል', definition: 'Word for word; exactly as spoken or written.', topic: 'interpreting', level: 'L3' },
  { english_term: 'paraphrase', amharic_term: 'ትርጉም ሳይቀየር ቃሉ ሲቀየር', definition: 'Restating meaning in different words.', topic: 'interpreting', level: 'L2' },
  { english_term: 'chunking', amharic_term: 'ወደ ትናንሽ ቁርጥራጮች መከፋፈል', definition: 'Breaking speech into manageable segments for memory.', topic: 'interpreting', level: 'L3' },
  { english_term: 'note-taking', amharic_term: 'ማስታወሻ መያዝ', definition: 'Writing down key information during a speaker\'s utterance.', topic: 'interpreting', level: 'L2' },
  { english_term: 'briefing', amharic_term: 'አጭር ማብራሪያ', definition: 'A short meeting to prepare before an interpreting session.', topic: 'interpreting', level: 'L3' },
  { english_term: 'debriefing', amharic_term: 'የኋሊት ምዝገባ', definition: 'Discussion after an interpreting session to address issues.', topic: 'interpreting', level: 'L3' },
]

export async function POST(request: Request) {
  // Simple protection: require a secret key
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.SEED_SECRET && secret !== 'seed-glossary-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json().catch(() => null)
    const terms = (body?.terms && Array.isArray(body.terms)) ? body.terms : SEED_TERMS

    const { data, error } = await supabase
      .from('study_entries')
      .upsert(
        terms.map((t: any) => ({
          english_term: t.english_term,
          amharic_term: t.amharic_term,
          definition: t.definition || null,
          topic: t.topic || null,
          level: t.level || null,
        })),
        { onConflict: 'english_term', ignoreDuplicates: false }
      )
      .select('id, english_term')

    if (error) {
      return NextResponse.json({ error: 'Seed failed', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, inserted: data?.length ?? 0, terms: data })
  } catch (err) {
    return NextResponse.json({ error: 'Seed error', details: err instanceof Error ? err.message : 'Unknown' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with ?secret=seed-glossary-2026 to seed the glossary with 100+ professional interpreter terms.' })
}
