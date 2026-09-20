/**
 * Reference lists for the healthcare-specific structured fields.
 *
 * In the real product these would come from a curated taxonomy service; here they are
 * static constants so every select/toggle in the demo is driven by one source of truth.
 */

export const ROLE_TYPES = [
  'Doctor / Consultant',
  'Nurse',
  'Diagnostic technician',
  'Lab technologist',
  'Pharmacist',
  'Allied health',
  'Hospital administration / management',
  'Support',
] as const;

export const SPECIALTIES = [
  'Obstetrics & Gynaecology',
  'Paediatrics / Neonatology',
  'Cardiology',
  'Radiology',
  'Anaesthesia',
  'Emergency Medicine',
  'Oncology',
  'Pathology',
  'Physiotherapy',
  'Critical Care',
  'General Medicine',
  'Orthopaedics',
] as const;

/** Sub-specialties are scoped to a parent specialty so the form can cascade. */
export const SUB_SPECIALTIES: Record<string, string[]> = {
  'Obstetrics & Gynaecology': [
    'High-risk obstetrics',
    'Gynae-oncology',
    'Infertility / IVF',
    'Maternity & neonatal nursing',
    'Obstetric OT',
  ],
  'Paediatrics / Neonatology': ['NICU', 'Paediatric emergency', 'Paediatric cardiology', 'Neonatal nursing'],
  Cardiology: ['Interventional cardiology', 'Non-invasive cardiology', 'Cath lab', 'Echocardiography'],
  Radiology: ['MRI', 'CT', 'Ultrasound', 'Interventional radiology', 'X-ray / general radiography'],
  Anaesthesia: ['Cardiac anaesthesia', 'Obstetric anaesthesia', 'Pain management', 'OT anaesthesia technician'],
  'Emergency Medicine': ['Trauma & casualty', 'Triage', 'Ambulance / pre-hospital'],
  Oncology: ['Medical oncology', 'Radiation oncology', 'Surgical oncology', 'Oncology day-care nursing'],
  Pathology: ['Histopathology', 'Haematology', 'Clinical biochemistry', 'Microbiology'],
  Physiotherapy: ['Musculoskeletal', 'Neuro rehabilitation', 'Cardio-pulmonary rehab'],
  'Critical Care': ['ICU / critical care nursing', 'Ventilator management', 'CCU'],
  'General Medicine': ['OPD consultation', 'Ward management', 'Diabetology'],
  Orthopaedics: ['Arthroplasty', 'Spine', 'Sports injury', 'OT / orthopaedic assistance'],
};

export const CREDENTIALS = [
  'NMC registration (national)',
  'State Medical Council registration',
  'Indian Nursing Council registration',
  'State Nursing Council registration',
  'BLS certification',
  'ACLS certification',
  'NRP (Neonatal Resuscitation) certification',
  'AERB radiation safety clearance',
  'Pharmacy Council registration',
  'NABL-lab competency sign-off',
  'Fire & safety mandatory training',
] as const;

export const SHIFTS = [
  'Day',
  'Evening',
  'Night',
  '5–8 PM OPD slot',
  '8–11 AM OPD slot',
  'Rotational',
  'On-call',
  'Part-time / Locum',
  'Weekend only',
] as const;

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Locum / Visiting',
  'Consultant (fee-for-service)',
] as const;

export const LOCATIONS = [
  'Bengaluru, KA',
  'Hyderabad, TS',
  'Pune, MH',
  'Mumbai, MH',
  'Chennai, TN',
  'Delhi NCR',
  'Kochi, KL',
  'Ahmedabad, GJ',
] as const;

export const SURGICAL_ROLES = ['Primary / lead surgeon', 'Assisting'] as const;

export const PIPELINE_STAGES = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Offer',
  'Joined',
  '90-day follow-up',
] as const;
