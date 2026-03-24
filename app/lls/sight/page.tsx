'use client'

import { useState } from 'react'
import { FileText, Eye, CheckCircle2, ChevronRight, Activity } from 'lucide-react'
import Link from 'next/link'

const DOCUMENTS = [
  {
    id: 1,
    title: 'HIPAA Notice of Privacy Practices',
    type: 'Medical',
    text: `This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully. We are required by law to maintain the privacy of your protected health information (PHI) and to provide you with notice of our legal duties and privacy practices with respect to your PHI. We may use your PHI for treatment, payment, and health care operations.`,
    keyTerms: [
      { eng: 'disclosed', amh: 'ተገልጿል / ይፋ ተደርጓል' },
      { eng: 'access', amh: 'መድረሻ / ማግኘት' },
      { eng: 'protected health information (PHI)', amh: 'የተጠበቀ የጤና መረጃ' },
      { eng: 'treatment', amh: 'ሕክምና' },
      { eng: 'operations', amh: 'አሰራሮች / እንቅስቃሴዎች' }
    ]
  },
  {
    id: 2,
    title: 'Consent for Surgery',
    type: 'Medical',
    text: `I hereby authorize Dr. Smith and such assistants as may be selected by him to treat the condition or conditions which appear indicated by the diagnostic studies already performed. I understand the risks inherent in the surgical procedure, including but not limited to infection, severe bleeding, and adverse reactions to anesthesia. I acknowledge that no guarantees or assurances have been made to me regarding the outcome of this procedure.`,
    keyTerms: [
      { eng: 'authorize', amh: 'ፈቃድ እሰጣለሁ / እፈቅዳለሁ' },
      { eng: 'assistants', amh: 'ረዳቶች' },
      { eng: 'indicated', amh: 'የተጠቆመ' },
      { eng: 'inherent', amh: 'ተፈጥሯዊ / አብሮ የሚመጣ' },
      { eng: 'anesthesia', amh: 'ማደንዘዣ' },
      { eng: 'guarantees', amh: 'ዋስትናዎች' }
    ]
  },
  {
    id: 3,
    title: 'Notice of Eviction',
    type: 'Legal',
    text: `You are hereby notified that your tenancy of the premises identified above is terminated effective 30 days from the date of this notice. You must vacate the premises and deliver possession to the Landlord on or before that date. Failure to vacate the premises by the specified date may result in legal action against you to recover possession, including liability for damages, court costs, and attorney fees.`,
    keyTerms: [
      { eng: 'tenancy', amh: 'ተከራይነት' },
      { eng: 'premises', amh: 'ግቢ / ቤት' },
      { eng: 'terminated', amh: 'ተቋርጧል' },
      { eng: 'vacate', amh: 'ማስለቀቅ / መልቀቅ' },
      { eng: 'liability', amh: 'ተጠያቂነት / እዳ' }
    ]
  }
]

export default function SightTranslationPage() {
  const [docId, setDocId] = useState<number | null>(null)
  const [showTerms, setShowTerms] = useState(false)
  
  const activeDoc = DOCUMENTS.find(d => d.id === docId)

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <Link href="/lls" className="btn btn-ghost btn-sm" style={{ padding: 0, color: 'var(--brand-600)', marginBottom: 8 }}>← LLS Training Suite</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Eye size={26} color="var(--brand-500)" /> Sight Translation
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>
          Practice reading formal English documents and interpreting them directly into Amharic.
        </p>
      </div>

      {!activeDoc ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {DOCUMENTS.map(doc => (
            <div key={doc.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="badge badge-muted" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>{doc.type}</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{doc.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, flex: 1 }}>
                {doc.text.slice(0, 90)}...
              </p>
              <button onClick={() => setDocId(doc.id)} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Start Practice <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1.5fr 1fr' : '1fr', gap: 24 }}>
          
          {/* Document Viewer */}
          <div className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{activeDoc.title}</h2>
                <span className="badge badge-muted">{activeDoc.type} Document</span>
              </div>
              <button onClick={() => { setDocId(null); setShowTerms(false) }} className="btn btn-ghost btn-sm">Close</button>
            </div>
            
            <div style={{ 
              fontSize: 18, 
              lineHeight: 1.8, 
              color: 'var(--text-primary)', 
              fontFamily: 'georgia, serif',
              background: '#f8fafc',
              padding: 32,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              {activeDoc.text}
            </div>

            <div style={{ marginTop: 32, padding: 20, background: 'var(--surface-alt)', borderRadius: 12, border: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--brand-600)', fontWeight: 700, marginBottom: 8 }}>
                <Activity size={18} /> Instructions
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Read the document above aloud in Amharic. Maintain a steady, professional pace. If you encounter difficult vocabulary, click "Reveal Key Terms" for translation assistance.
              </p>
            </div>
          </div>

          {/* Key Terms Panel */}
          <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Key Vocabulary
              {!showTerms && (
                <button onClick={() => setShowTerms(true)} className="btn btn-sm" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                  <Eye size={14} /> Reveal Terms
                </button>
              )}
            </h3>

            {showTerms ? (
              <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeDoc.keyTerms.map((term, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{term.eng}</div>
                    <div style={{ fontSize: 14, color: 'var(--brand-600)', fontWeight: 600 }}>{term.amh}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 12, border: '2px dashed var(--border)' }}>
                <Eye size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Terms hidden to simulate real testing conditions.</p>
              </div>
            )}
            
            <button onClick={() => { setDocId(null); setShowTerms(false) }} className="btn btn-primary" style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}>
              <CheckCircle2 size={16} /> Mark as Completed
            </button>
          </div>

        </div>
      )}
    </main>
  )
}
