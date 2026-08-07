/**
 * Institute → accepted email domains, for SERVER-SIDE verification.
 *
 * Intentionally duplicated from the web app's content/institutes.ts. The client
 * copy drives the picker and its hints; this copy is the one that decides
 * whether a user may create or join a ride. A client-side check is a
 * convenience, never an authorisation boundary — so the two must be kept in
 * step, and this file is the one that matters.
 *
 * Matching is exact against the listed domains (including sub-domains listed
 * explicitly). Never suffix-match: "iitm.ac.in.attacker.com" must not pass.
 */
export const INSTITUTE_DOMAINS: Record<string, string[]> = {
  // IITs
  iitm: ['iitm.ac.in', 'smail.iitm.ac.in', 'student.onlinedegree.iitm.ac.in', 'ds.study.iitm.ac.in'],
  iitd: ['iitd.ac.in'],
  iitb: ['iitb.ac.in'],
  iitk: ['iitk.ac.in'],
  iitkgp: ['iitkgp.ac.in', 'kgpian.iitkgp.ac.in'],
  iitr: ['iitr.ac.in'],
  iitg: ['iitg.ac.in'],
  iith: ['iith.ac.in'],
  iitbhu: ['iitbhu.ac.in', 'itbhu.ac.in'],
  iitism: ['iitism.ac.in'],
  iiti: ['iiti.ac.in'],
  iitrpr: ['iitrpr.ac.in'],
  iitp: ['iitp.ac.in'],
  iitgn: ['iitgn.ac.in'],
  iitbbs: ['iitbbs.ac.in'],
  iitmandi: ['iitmandi.ac.in'],
  iitj: ['iitj.ac.in'],
  iittp: ['iittp.ac.in'],
  iitpkd: ['iitpkd.ac.in'],
  iitbhilai: ['iitbhilai.ac.in'],
  iitgoa: ['iitgoa.ac.in'],
  iitjammu: ['iitjammu.ac.in'],
  iitdh: ['iitdh.ac.in'],

  // NITs
  nitt: ['nitt.edu'],
  nitw: ['nitw.ac.in', 'student.nitw.ac.in'],
  nitk: ['nitk.edu.in'],
  nitrkl: ['nitrkl.ac.in'],
  nitc: ['nitc.ac.in'],
  mnnit: ['mnnit.ac.in'],
  mnit: ['mnit.ac.in'],
  vnit: ['vnit.ac.in'],
  svnit: ['svnit.ac.in'],
  manit: ['manit.ac.in'],
  nitdgp: ['nitdgp.ac.in'],
  nitkkr: ['nitkkr.ac.in'],
  nits: ['nits.ac.in'],
  nitjsr: ['nitjsr.ac.in'],
  nitp: ['nitp.ac.in'],
  nitrr: ['nitrr.ac.in'],
  nith: ['nith.ac.in'],
  nitj: ['nitj.ac.in'],
  nitsri: ['nitsri.ac.in'],
  nita: ['nita.ac.in'],
  nitgoa: ['nitgoa.ac.in'],
  nitm: ['nitm.ac.in'],
  nitpy: ['nitpy.ac.in'],
  nitdelhi: ['nitdelhi.ac.in'],
  nituk: ['nituk.ac.in'],
  nitap: ['nitandhra.ac.in'],
  nitmn: ['nitmanipur.ac.in'],
  nitmz: ['nitmz.ac.in'],
  nitn: ['nitnagaland.ac.in'],
  nitsk: ['nitsikkim.ac.in'],
  nitarp: ['nitap.ac.in'],

  // IIITs
  iiith: ['iiit.ac.in', 'students.iiit.ac.in', 'research.iiit.ac.in'],
  iiitb: ['iiitb.ac.in', 'iiitb.org'],
  iiitd: ['iiitd.ac.in', 'student.iiitd.ac.in'],
  iiita: ['iiita.ac.in'],
  iiitg: ['iiitg.ac.in'],
  iiitdmj: ['iiitdmj.ac.in'],

  // IISc / IISERs
  iisc: ['iisc.ac.in'],
  iiserp: ['iiserpune.ac.in', 'students.iiserpune.ac.in'],
  iiserk: ['iiserkol.ac.in'],
  iiserb: ['iiserb.ac.in'],
  iiserm: ['iisermohali.ac.in'],
  iisertvm: ['iisertvm.ac.in'],

  // Universities
  du: ['du.ac.in'],
  jnu: ['jnu.ac.in', 'mail.jnu.ac.in'],
  jmi: ['jmi.ac.in'],
  bhuni: ['bhu.ac.in'],
  amu: ['amu.ac.in', 'myamu.ac.in'],
  vit: ['vit.ac.in', 'vitstudent.ac.in'],
  srm: ['srmist.edu.in', 'srmuniv.ac.in'],
  manipal: ['manipal.edu', 'learner.manipal.edu'],
  bits: [
    'pilani.bits-pilani.ac.in',
    'goa.bits-pilani.ac.in',
    'hyderabad.bits-pilani.ac.in',
    'bits-pilani.ac.in',
  ],
  annauniv: ['annauniv.edu'],
  ju: ['jadavpuruniversity.in'],
  dtu: ['dtu.ac.in'],
  nsut: ['nsut.ac.in'],
  iiitdmk: ['thapar.edu'],
  coep: ['coeptech.ac.in', 'coep.ac.in'],
  ict: ['ictmumbai.edu.in'],

  // No verifiable domain — these users can never pass the ride gate, which the
  // UI states plainly rather than letting them discover it at the last step.
  other: [],
};

/** Exact domain match only. */
export function emailMatchesInstitute(email: string, instituteId: string): boolean {
  const domains = INSTITUTE_DOMAINS[instituteId];
  if (!domains || domains.length === 0) return false;

  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();

  return domains.some((d) => domain === d.toLowerCase());
}

export function isKnownInstitute(instituteId: string): boolean {
  return Object.prototype.hasOwnProperty.call(INSTITUTE_DOMAINS, instituteId);
}

export function institutePrimaryDomain(instituteId: string): string | null {
  return INSTITUTE_DOMAINS[instituteId]?.[0] ?? null;
}
