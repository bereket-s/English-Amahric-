// src/lib/scenarios.ts

export type Scenario = {
  id: string
  title: string
  description: string
  script: string[]
  keyFacts: { label: string; value: string }[]
}

export const PRACTICE_EXERCISES: Scenario[] = [
  {
    id: 'medical',
    title: '🏥 Medical Appointment',
    description: 'A patient calling to schedule, then speaking with a doctor.',
    script: [
      'Receptionist: Good morning, Valley Medical Center. How can I help you?',
      'Patient: Hi, my name is Samuel Tesfaye. I need to schedule an appointment with Dr. Johnson.',
      'Receptionist: Sure. Can I get your date of birth and insurance member ID?',
      'Patient: My date of birth is March 15th, 1985. My member ID is BCA-447821.',
      'Receptionist: And what is the reason for your visit today?',
      'Patient: I have been having shortness of breath and chest pain for about three days.',
      'Receptionist: Okay. We have an opening this Thursday at 2:30 PM. Does that work?',
      'Patient: Yes, that works. My phone number is 617-555-0193.',
      'Receptionist: Great. Your confirmation number is MED-20940. Please bring your insurance card.',
    ],
    keyFacts: [
      { label: 'Patient name', value: 'Samuel Tesfaye' },
      { label: 'DOB', value: 'March 15, 1985' },
      { label: 'Member ID', value: 'BCA-447821' },
      { label: 'Symptoms', value: 'Shortness of breath, chest pain' },
      { label: 'Appointment', value: 'Thursday 2:30 PM' },
      { label: 'Phone', value: '617-555-0193' },
      { label: 'Confirmation #', value: 'MED-20940' },
    ],
  },
  {
    id: 'insurance',
    title: '🛡 Insurance Claim Call',
    description: 'A client calling their insurance company to file a claim.',
    script: [
      'Agent: Thank you for calling Horizon Insurance. My name is Lisa. How can I assist you?',
      'Caller: I need to file a claim for a car accident I had on Sunday.',
      'Agent: I am sorry to hear that. Can I have your policy number?',
      'Caller: Yes, it is PPO-33-77614.',
      'Agent: And your full name and date of birth?',
      'Caller: Miriam Alemu, date of birth July 4th, 1978.',
      'Agent: Thank you. Was anyone injured?',
      'Caller: No, just property damage. The repair estimate is about four thousand dollars.',
      'Agent: I will open a claim. Your claim number is CLM-2026-8844. Someone will contact you within 3 business days.',
      'Caller: What is your name and direct extension?',
      'Agent: Lisa Carter, extension 4412.',
    ],
    keyFacts: [
      { label: 'Policy number', value: 'PPO-33-77614' },
      { label: 'Client name', value: 'Miriam Alemu' },
      { label: 'DOB', value: 'July 4, 1978' },
      { label: 'Damage estimate', value: '$4,000' },
      { label: 'Claim number', value: 'CLM-2026-8844' },
      { label: 'Agent', value: 'Lisa Carter, ext. 4412' },
    ],
  },
  {
    id: 'banking',
    title: '🏦 Bank Account Inquiry',
    description: 'A customer calling their bank to dispute a charge and transfer funds.',
    script: [
      'Bank rep: Welcome to FirstBank customer service. My name is Daniel.',
      'Customer: Hi Daniel. I am calling about my checking account. There is a charge I do not recognize.',
      'Bank rep: I can look into that. Can I have your account number for verification?',
      'Customer: Sure. My account number is 0083-4421-99.',
      'Bank rep: And your full name and last four digits of your social security number?',
      'Customer: Abebe Girma, last four 3-8-7-2.',
      'Bank rep: Thank you. I can see a charge on March 20th for $248 from OnlineShop LLC. Do you recognize that?',
      'Customer: No, I do not. I want to dispute it.',
      'Bank rep: I will open a dispute. The dispute reference number is DSP-441899. Also, would you like to transfer your available balance to savings as a precaution?',
      'Customer: Yes please. My savings account routing number is 021000089.',
      'Bank rep: The transfer of $1,340 has been initiated. It will post within one business day.',
    ],
    keyFacts: [
      { label: 'Account number', value: '0083-4421-99' },
      { label: 'Customer name', value: 'Abebe Girma' },
      { label: 'SSN last 4', value: '3872' },
      { label: 'Disputed charge', value: '$248 from OnlineShop LLC, March 20' },
      { label: 'Dispute reference', value: 'DSP-441899' },
      { label: 'Routing number', value: '021000089' },
      { label: 'Transfer amount', value: '$1,340' },
    ],
  },
]
