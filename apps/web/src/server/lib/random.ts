export function randomInt(max: number): number {
  if (max <= 0) throw new Error("max must be > 0");
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

export function randomBase32(len: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}
