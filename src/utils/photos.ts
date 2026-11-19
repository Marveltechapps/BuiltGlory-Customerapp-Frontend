// Photo library from the design (Unsplash CDN). The same tag always resolves to the same photo.

const UNSPLASH = {
  exterior: ['1568605114967-8130f3a36994', '1512917774080-9991f1c4c750', '1600596542815-ffad4c1539a9', '1580587771525-78b9dba3b914', '1600585154340-be6161a56a0c', '1570129477492-45c003edd2be', '1493809842364-78817add7ffb', '1564013799919-ab600027ffc6', '1449844908441-8829872d2607', '1416331108676-a22ccb276e35', '1486304873000-235643847519', '1484154218962-a197022b5858'],
  interior: ['1600607687939-ce8a6c25118c', '1600566753086-00f18fb6b3ea', '1605276374104-dee2a0ed3cd6', '1600210492486-724fe5c67fb0', '1600573472550-8090b5e0745e', '1600047509807-ba8f99d2cdde', '1600121848594-d8644e57abab', '1583608205776-bfd35f0d9f83', '1615875605825-5eb9bb5d52ac', '1598928506311-c55ded91a20c', '1502005229762-cf1b2da7c5d6', '1567496898669-ee935f5f647a'],
  urban: ['1502672260266-1c1ef2d93688', '1560448204-e02f11c3d0e2', '1522708323590-d24dbb6b0267', '1586023492125-27b2c045efd7', '1613490493576-7fde63acd811', '1597211684565-dca64d72bdfe', '1531835551805-16d864c8d311', '1554995207-c18c203602cb', '1556912167-f556f1f39fdf', '1512915922686-57c11dde9b6b', '1599809275671-b5942cabc7a2', '1600494603989-9650cf6ddd3d'],
};
const ALL_PHOTOS = [...UNSPLASH.exterior, ...UNSPLASH.interior, ...UNSPLASH.urban];

/** djb2 hash, identical to the design's hashTag. */
export function hashTag(t: unknown): number {
  const s = String(t ?? '');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

export function photoUrl(id: string, w = 800): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=72&auto=format&fit=crop`;
}

export function photoFor(tag: unknown, w = 800): string {
  return photoUrl(ALL_PHOTOS[hashTag(tag) % ALL_PHOTOS.length], w);
}

/** A coherent gallery per property: exterior first, then interiors. */
export function galleryFor(seed: unknown, n = 4): string[] {
  const h = hashTag(seed);
  const out = [UNSPLASH.exterior[h % UNSPLASH.exterior.length]];
  for (let i = 1; i < n; i++) {
    const pool = i % 3 === 2 ? UNSPLASH.urban : UNSPLASH.interior;
    out.push(pool[(h + i * 7) % pool.length]);
  }
  return out.map(id => photoUrl(id, 800));
}
