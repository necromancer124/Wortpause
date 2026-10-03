export function parseVocabulary(text) {
  return text.split(/\r?\n/).flatMap(line => {
    if (!line.trim()) return [];
    const fields = line.split('\t');
    if (fields.length < 8) return [];
    const [id, german, germanExample, english, englishExample, register, note, audioTag] = fields;
    const audio = audioTag.match(/\[sound:([^\]]+)\]/)?.[1] || '';
    if (!id || !german || !english) return [];
    return [{ id, german, germanExample, english, englishExample, register, note, audio }];
  });
}
