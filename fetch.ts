import fs from 'fs';
const data = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));

const allCombs = [];
for (const key of Object.keys(data.data)) {
  const emojiData = data.data[key];
  if (emojiData.combinations) {
    for (const otherKey of Object.keys(emojiData.combinations)) {
      for (const comb of emojiData.combinations[otherKey]) {
        // avoid self combination for a bit more variety, though self combinations are cool
        allCombs.push({
           url: comb.gStaticUrl,
           leftEmoji: comb.leftEmoji,
           rightEmoji: comb.rightEmoji,
           leftCodepoint: comb.leftEmojiCodepoint,
           rightCodepoint: comb.rightEmojiCodepoint
        });
      }
    }
  }
}

// deduplicate since a+b and b+a might be the same? Usually it is stored under both.
// Let's create a unique set based on url
const unique = new Map();
for(const c of allCombs) {
  unique.set(c.url, c);
}
const finalCombs = Array.from(unique.values());
finalCombs.sort(() => Math.random() - 0.5);

const subset = finalCombs.slice(0, 5000);
fs.mkdirSync('src/data', {recursive: true});
fs.writeFileSync('src/data/combinations.json', JSON.stringify(subset, null, 2));

console.log('Saved 5000 random combinations');
