// Transparent starter rules, not a trained ML model or a fraud verdict.
const RULES = [
  { words: ['registration fee','processing fee','refundable fee','pay a fee','payment required','security deposit','training fee','joining fee'], points: 34, message: 'The posting mentions an upfront payment. Verify independently; legitimate employers generally do not charge candidates to secure a job.' },
  { words: ['guaranteed job','guaranteed placement','100% selection','selected without interview'], points: 18, message: 'A guaranteed selection claim can be misleading.' },
  { words: ['limited seats','act now','urgent payment','within 24 hours','immediately'], points: 12, message: 'High-pressure language may be intended to rush applicants.' },
  { words: ['aadhaar','bank details','otp','passport','credit card'], points: 22, message: 'The text asks for sensitive personal or financial information.' },
  { words: ['earn ₹','earn rs','per week','daily income','no experience'], points: 10, message: 'High earnings paired with little or no experience deserve extra scrutiny.' },
  { words: ['whatsapp only','telegram only','personal gmail','contact on whatsapp'], points: 12, message: 'The recruiter relies on informal or personal contact channels.' }
];
function scanPosting(text, contact = '') {
  const value = String(text || '').toLowerCase();
  if (!value.trim()) throw new Error('Posting text is required.');
  let score = 8;
  const flags = [];
  for (const rule of RULES) {
    const matches = rule.words.filter(word => value.includes(word));
    if (matches.length) { score += rule.points; flags.push({ message: rule.message, matches }); }
  }
  if (contact && /@(gmail|yahoo|outlook|hotmail)\./i.test(contact)) {
    score += 10;
    flags.push({ message: 'A generic email provider is used. This is not proof of fraud; verify the recruiter through official company channels.', matches: [contact] });
  }
  score = Math.min(100, score);
  return { score, level: score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW', flags,
    disclaimer: 'Prototype signal check only. It does not verify a company or prove fraud.' };
}
module.exports = { scanPosting };
