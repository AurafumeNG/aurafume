import type { PDPProduct } from './types';

export const PRODUCTS: Record<string, PDPProduct> = {
  'loving-you-frozen': {
    id: 'loving-you-frozen',
    slug: 'loving-you-frozen',
    name: 'Loving You Frozen',
    descriptor: 'A delicate bloom suspended in crystal air',
    scentFamily: 'Floral · Musky · Amber',
    badge: 'Best Seller',
    images: ['/images/image5.jpeg', '/images/image7.jpeg', '/images/image2.jpeg', '/images/image6.jpeg'],
    variants: [
      { size: '30ml',  price: 89500,  stock: 12 },
      { size: '50ml',  price: 149500, stock: 3  },
      { size: '100ml', price: 225000, stock: 0  },
    ],
    scentNotes: {
      top:   ['Bergamot', 'Pink Pepper', 'Lemon'],
      heart: ['Rose', 'Jasmine', 'Iris'],
      base:  ['White Musk', 'Amber', 'Sandalwood'],
    },
    description: `Loving You Frozen is an ode to stillness — that breathless moment when emotion overwhelms language and the world seems to pause around you.

Opening with a burst of bergamot and the faintest dusting of pink pepper, it immediately softens into a heart of rose and jasmine; classic, romantic, yet restrained. The base is where the magic lingers: a warm veil of white musk and amber that clings gently to fabric and skin long after the day has ended.

Wear it on quiet evenings, on first dates, or any time you want to carry an invisible tenderness with you.`,
    specs: {
      gender:        'Feminine · Unisex',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'France',
      longevity:     '8–10 hours',
      sillage:       'Moderate',
    },
    occasions:    ['Evening', 'Date Night', 'Special Occasion', 'All Season'],
    relatedSlugs: ['aurore-blanche', 'petite-fleur', 'citrus-bloom'],
    bundleSlugs:  ['aurore-blanche', 'petite-fleur'],
  },

  'stronger-for-you-intense': {
    id: 'stronger-for-you-intense',
    slug: 'stronger-for-you-intense',
    name: 'Stronger For You Intense',
    descriptor: 'A bold, smoky trail of oud and amber',
    scentFamily: 'Woody · Spicy · Warm',
    images: ['/images/image3.jpeg', '/images/image9.jpeg', '/images/image11.jpeg', '/images/image8.jpeg'],
    variants: [
      { size: '50ml',  price: 175000, stock: 8 },
      { size: '100ml', price: 265000, stock: 2 },
    ],
    scentNotes: {
      top:   ['Cardamom', 'Ginger', 'Pink Pepper'],
      heart: ['Amberwood', 'Lavender', 'Violet'],
      base:  ['Oud', 'Vetiver', 'Amber', 'Musk'],
    },
    description: `Stronger For You Intense is not a fragrance — it is a declaration. It opens with the assertive warmth of cardamom and fresh ginger before revealing an amberwood and lavender heart that is simultaneously masculine and deeply sensual.

The base is where it truly earns its name: a rich, resinous oud anchored by vetiver and a thick amber that trails behind you like a slow-moving shadow. This is the fragrance of quiet confidence — the kind that fills a room before you say a word.

Best worn in cooler weather, evening events, or any occasion where presence matters.`,
    specs: {
      gender:        'Masculine · Unisex',
      concentration: 'Eau de Parfum Intense (EDP)',
      origin:        'France',
      longevity:     '10–14 hours',
      sillage:       'Heavy',
    },
    occasions:    ['Evening', 'Date Night', 'Cool Weather', 'Power Moves'],
    relatedSlugs: ['stronger-for-you-absolute', 'cedar-dusk', 'vetiver-noir'],
    bundleSlugs:  ['vetiver-noir', 'cedar-dusk'],
  },

  'stronger-for-you-absolute': {
    id: 'stronger-for-you-absolute',
    slug: 'stronger-for-you-absolute',
    name: 'Stronger For You Absolute',
    descriptor: 'Opulent resin, rich as antique gold',
    scentFamily: 'Oriental · Resinous · Bold',
    badge: 'New',
    images: ['/images/image11.jpeg', '/images/image8.jpeg', '/images/image4.jpeg', '/images/image10.jpeg'],
    variants: [
      { size: '50ml',  price: 185000, stock: 15 },
      { size: '100ml', price: 285000, stock: 1  },
    ],
    scentNotes: {
      top:   ['Saffron', 'Black Pepper', 'Bergamot'],
      heart: ['Rose Absolute', 'Guaiac Wood', 'Patchouli'],
      base:  ['Oud', 'Amber Resin', 'Benzoin', 'Musk'],
    },
    description: `Stronger For You Absolute is the most opulent expression in the Stronger line — a deeply oriental composition built around precious raw materials and an unwavering commitment to richness.

Saffron and black pepper announce an opening of rare complexity. The heart reveals a rose absolute of extraordinary quality, layered over guaiac wood and dark patchouli. The base is unashamedly luxurious: oud, amber resin, and benzoin that dry down to a skin-close warmth that lasts through the night.

This is for those who understand that true luxury is felt, not seen.`,
    specs: {
      gender:        'Unisex',
      concentration: 'Eau de Parfum Absolute (EDP)',
      origin:        'UAE · France',
      longevity:     '12–16 hours',
      sillage:       'Heavy',
    },
    occasions:    ['Evening', 'Black Tie', 'Special Occasion', 'Cool Weather'],
    relatedSlugs: ['oud-imperiale', 'amber-noir', 'rose-oud'],
    bundleSlugs:  ['oud-imperiale', 'rose-oud'],
  },

  'oud-imperiale': {
    id: 'oud-imperiale',
    slug: 'oud-imperiale',
    name: 'Oud Impériale',
    descriptor: 'A sovereign darkness, worn like armour',
    scentFamily: 'Oud · Black Rose · Amber · Incense',
    badge: 'New',
    images: ['/images/image8.jpeg', '/images/image10.jpeg', '/images/image4.jpeg', '/images/image3.jpeg'],
    variants: [
      { size: '15ml',  price: 55000,  stock: 7  },
      { size: '50ml',  price: 145000, stock: 3  },
      { size: '100ml', price: 235000, stock: 0  },
    ],
    scentNotes: {
      top:   ['Incense', 'Black Pepper', 'Elemi'],
      heart: ['Black Rose', 'Oud Heart', 'Labdanum'],
      base:  ['Oud Wood', 'Amber', 'Musks', 'Castoreum'],
    },
    description: `Oud Impériale does not ask for your attention — it commands it.

Conceived as an homage to the great oud traditions of the Arabian Peninsula, this composition opens with a sacred plume of incense and black pepper that parts like ceremonial smoke. At its heart, a black rose of uncommon depth intertwines with raw oud — not the polished, sweetened oud of modern compositions, but something rawer, more ancient.

The base is a fortress: oud wood, amber, and musks that anchor everything to the skin and refuse to leave. This is fragrance as ceremony, worn by those who understand that scent can be a form of power.`,
    specs: {
      gender:        'Unisex',
      concentration: 'Extrait de Parfum',
      origin:        'UAE',
      longevity:     '14–18 hours',
      sillage:       'Very Heavy',
    },
    occasions:    ['Evening', 'Black Tie', 'Special Occasion', 'Ceremonies'],
    relatedSlugs: ['rose-oud', 'amber-noir', 'stronger-for-you-absolute'],
    bundleSlugs:  ['stronger-for-you-absolute', 'amber-noir'],
  },

  'suger-edp': {
    id: 'suger-edp',
    slug: 'suger-edp',
    name: 'Suger EDP',
    descriptor: 'Crisp greenery cut through with morning dew',
    scentFamily: 'Fresh · Green · Earthy',
    images: ['/images/image1.jpeg', '/images/image2.jpeg', '/images/image7.jpeg', '/images/image6.jpeg'],
    variants: [
      { size: '30ml', price: 79500,  stock: 18 },
      { size: '50ml', price: 139500, stock: 9  },
    ],
    scentNotes: {
      top:   ['Green Leaves', 'Cucumber', 'Lime'],
      heart: ['Violet Leaf', 'Iris', 'Hedione'],
      base:  ['Vetiver', 'Cedarwood', 'White Musk'],
    },
    description: `Suger EDP is the scent of a garden at 6am — before the heat settles in and while the dew still clings to everything it touches.

The opening is arrestingly green: crushed leaves, cool cucumber, and a zesty lime that gives way to a heart of iris and violet leaf — botanical and refined without being stiff. The base grounds everything in vetiver and cedarwood, lending an earthy backbone that prevents the composition from drifting into mere freshness.

A versatile everyday fragrance that works from morning commute to afternoon meetings.`,
    specs: {
      gender:        'Unisex',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'France',
      longevity:     '6–8 hours',
      sillage:       'Light to Moderate',
    },
    occasions:    ['Everyday', 'Office', 'Morning', 'All Season'],
    relatedSlugs: ['citrus-bloom', 'aurore-blanche', 'loving-you-frozen'],
    bundleSlugs:  ['citrus-bloom', 'aurore-blanche'],
  },

  'aurore-blanche': {
    id: 'aurore-blanche',
    slug: 'aurore-blanche',
    name: 'Aurore Blanche',
    descriptor: 'Light caught at dawn, soft as magnolia petals',
    scentFamily: 'White Musk · Magnolia · Cedarwood',
    badge: 'New',
    images: ['/images/image7.jpeg', '/images/image5.jpeg', '/images/image6.jpeg', '/images/image2.jpeg'],
    variants: [
      { size: '15ml',  price: 48000,  stock: 11 },
      { size: '50ml',  price: 132000, stock: 6  },
      { size: '100ml', price: 215000, stock: 2  },
    ],
    scentNotes: {
      top:   ['Magnolia', 'White Peach', 'Aldehydes'],
      heart: ['Jasmine Sambac', 'Lily of the Valley', 'Orris'],
      base:  ['White Musk', 'Cedarwood', 'Ambrette'],
    },
    description: `Aurore Blanche is named for the French phrase for white dawn — and it embodies exactly that: the first, purest light of morning rendered in scent.

Its opening is luminous, almost radiant, with magnolia and white peach carried on a whisper of aldehydes that gives it a classic, almost vintage quality. The heart is a study in white florals — jasmine sambac and lily of the valley — that are transparent rather than heady. The base is clean cedarwood and white musk; a fragrance that ends as softly as it begins.

For those who prefer elegance over statement.`,
    specs: {
      gender:        'Feminine · Unisex',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'France',
      longevity:     '7–9 hours',
      sillage:       'Light to Moderate',
    },
    occasions:    ['Office', 'Everyday', 'Brunch', 'All Season'],
    relatedSlugs: ['loving-you-frozen', 'petite-fleur', 'suger-edp'],
    bundleSlugs:  ['loving-you-frozen', 'petite-fleur'],
  },

  'vetiver-noir': {
    id: 'vetiver-noir',
    slug: 'vetiver-noir',
    name: 'Vétiver Noir',
    descriptor: 'Earth and smoke, raw and unfiltered',
    scentFamily: 'Vetiver · Smoke · Leather · Dry Wood',
    badge: 'New',
    images: ['/images/image11.jpeg', '/images/image3.jpeg', '/images/image9.jpeg', '/images/image10.jpeg'],
    variants: [
      { size: '15ml',  price: 52000,  stock: 8  },
      { size: '50ml',  price: 138000, stock: 3  },
      { size: '100ml', price: 224000, stock: 1  },
    ],
    scentNotes: {
      top:   ['Smoked Wood', 'Black Tea', 'Bergamot'],
      heart: ['Vetiver', 'Leather', 'Geranium'],
      base:  ['Birch Tar', 'Dark Amber', 'Patchouli', 'Musk'],
    },
    description: `Vétiver Noir is for those who find beauty in the unpolished and meaning in the elemental. It is a fragrance that does not flatter — it speaks the truth.

The opening is an immediate declaration: smoked wood and black tea, dry and precise. The vetiver at its heart is Haitian — earthy, almost medicinal — softened only slightly by geranium and a note of dry leather. The base is a slow-burning darkness of birch tar and dark amber that reveals itself gradually over hours.

This is not a crowd-pleaser. It is a companion for those with the patience to understand it.`,
    specs: {
      gender:        'Masculine · Unisex',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'France · Haiti',
      longevity:     '10–12 hours',
      sillage:       'Moderate to Heavy',
    },
    occasions:    ['Evening', 'Office', 'Cool Weather', 'Autumn / Winter'],
    relatedSlugs: ['cedar-dusk', 'stronger-for-you-intense', 'amber-noir'],
    bundleSlugs:  ['cedar-dusk', 'stronger-for-you-intense'],
  },

  'citrus-bloom': {
    id: 'citrus-bloom',
    slug: 'citrus-bloom',
    name: 'Citrus Bloom',
    descriptor: 'Zest of sun-warmed citrus on a white floral bed',
    scentFamily: 'Citrus · Fresh · Floral',
    images: ['/images/image2.jpeg', '/images/image1.jpeg', '/images/image7.jpeg', '/images/image6.jpeg'],
    variants: [
      { size: '30ml', price: 62000, stock: 20 },
      { size: '50ml', price: 98000, stock: 14 },
    ],
    scentNotes: {
      top:   ['Sicilian Lemon', 'Grapefruit', 'Neroli'],
      heart: ['Orange Blossom', 'Ylang Ylang', 'Jasmine'],
      base:  ['Musk', 'Amber', 'Sandalwood'],
    },
    description: `Citrus Bloom is unabashedly joyful — a fragrance that arrives like sunlight through a window and refuses to be anything other than radiant.

Sicilian lemon and grapefruit open with the kind of vivacity that puts you in a good mood before you've had your first coffee. Orange blossom and ylang ylang form the heart, lending a floral sweetness that never tips into excess. The base is a light amber and sandalwood that provides just enough staying power without weighing the composition down.

Effortless, sociable, and completely unserious — exactly what a citrus fragrance should be.`,
    specs: {
      gender:        'Unisex',
      concentration: 'Eau de Toilette (EDT)',
      origin:        'Italy · France',
      longevity:     '5–7 hours',
      sillage:       'Light',
    },
    occasions:    ['Everyday', 'Office', 'Summer', 'All Season'],
    relatedSlugs: ['suger-edp', 'aurore-blanche', 'petite-fleur'],
    bundleSlugs:  ['suger-edp', 'petite-fleur'],
  },

  'rose-oud': {
    id: 'rose-oud',
    slug: 'rose-oud',
    name: 'Rose Oud',
    descriptor: 'The eternal rose, deepened by precious oud',
    scentFamily: 'Floral · Oriental · Rose',
    badge: 'Low Stock',
    images: ['/images/image4.jpeg', '/images/image5.jpeg', '/images/image8.jpeg', '/images/image7.jpeg'],
    variants: [
      { size: '50ml',  price: 195000, stock: 2 },
      { size: '100ml', price: 295000, stock: 1 },
    ],
    scentNotes: {
      top:   ['Bulgarian Rose', 'Saffron', 'Pink Pepper'],
      heart: ['Rose Absolute', 'Oud', 'Orris'],
      base:  ['Agarwood', 'Amber', 'Musk', 'Sandalwood'],
    },
    description: `Rose Oud is the meeting of two of perfumery's oldest and most revered ingredients — a conversation between East and West, between the garden and the souk.

The opening is immediately luxurious: Bulgarian rose and saffron unfurl together with a richness that recalls the spice markets of the ancient world. At the heart, rose absolute and oud merge — the flower becoming deeper, the wood becoming softer, each transforming the other into something neither could achieve alone. The base is a long, warm resolution: agarwood, amber, and sandalwood that carry the rose-oud accord through the night and into the next morning.

Wear it on occasions you want to remember.`,
    specs: {
      gender:        'Unisex',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'Bulgaria · UAE',
      longevity:     '12–15 hours',
      sillage:       'Heavy',
    },
    occasions:    ['Evening', 'Special Occasion', 'Black Tie', 'Ceremonies'],
    relatedSlugs: ['oud-imperiale', 'stronger-for-you-absolute', 'amber-noir'],
    bundleSlugs:  ['oud-imperiale', 'amber-noir'],
  },

  'cedar-dusk': {
    id: 'cedar-dusk',
    slug: 'cedar-dusk',
    name: 'Cedar Dusk',
    descriptor: 'Warm cedar embers glowing at twilight',
    scentFamily: 'Woody · Earthy · Cedar',
    images: ['/images/image9.jpeg', '/images/image3.jpeg', '/images/image11.jpeg', '/images/image10.jpeg'],
    variants: [
      { size: '30ml',  price: 72000,  stock: 15 },
      { size: '50ml',  price: 115000, stock: 10 },
      { size: '100ml', price: 185000, stock: 5  },
    ],
    scentNotes: {
      top:   ['Juniper Berry', 'Cardamom', 'Grapefruit'],
      heart: ['Atlas Cedar', 'Guaiac Wood', 'Clary Sage'],
      base:  ['Vetiver', 'Tonka Bean', 'Amber', 'Musk'],
    },
    description: `Cedar Dusk was composed with a single image in mind: a late October evening, a fire burning low, the air outside cool and sharp. It is a fragrance for the transition hour — that moment between day and night when everything softens.

Juniper berry and cardamom form a crisp, slightly resinous opening that gives way to a heart of Atlas cedar — clean, dry, and architectural. Guaiac wood adds a subtle smokiness, while the base of vetiver and tonka bean lends a creamy warmth that feels like settling in for the evening.

A reliable, deeply wearable fragrance for autumn and winter.`,
    specs: {
      gender:        'Masculine · Unisex',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'France · Morocco',
      longevity:     '8–11 hours',
      sillage:       'Moderate',
    },
    occasions:    ['Evening', 'Office', 'Autumn / Winter', 'Cool Weather'],
    relatedSlugs: ['vetiver-noir', 'stronger-for-you-intense', 'amber-noir'],
    bundleSlugs:  ['vetiver-noir', 'amber-noir'],
  },

  'petite-fleur': {
    id: 'petite-fleur',
    slug: 'petite-fleur',
    name: 'Petite Fleur',
    descriptor: 'Powdery softness, like a first bloom in spring',
    scentFamily: 'Floral · Powdery · Soft Musk',
    badge: 'Low Stock',
    images: ['/images/image6.jpeg', '/images/image7.jpeg', '/images/image2.jpeg', '/images/image5.jpeg'],
    variants: [
      { size: '15ml', price: 52000, stock: 2 },
      { size: '30ml', price: 88000, stock: 1 },
    ],
    scentNotes: {
      top:   ['Peony', 'Pink Freesia', 'Pear'],
      heart: ['Rose', 'Violet', 'Heliotrope'],
      base:  ['Soft Musk', 'Powdery Iris', 'Cashmere Wood'],
    },
    description: `Petite Fleur is an exercise in restraint and tenderness — a fragrance that whispers rather than speaks, and is all the more compelling for it.

Its opening is as gentle as its name suggests: peony and pink freesia with a hint of pear, fresh and innocent. The heart blooms slowly into rose, violet, and heliotrope — a classic powdery floral accord that feels timeless without feeling dated. The base settles into the softest of musks, a cashmere warmth that makes it almost indistinguishable from clean skin.

For those who believe that femininity needs no amplification.`,
    specs: {
      gender:        'Feminine',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'France',
      longevity:     '6–8 hours',
      sillage:       'Light',
    },
    occasions:    ['Everyday', 'Office', 'Spring', 'Romantic'],
    relatedSlugs: ['loving-you-frozen', 'aurore-blanche', 'citrus-bloom'],
    bundleSlugs:  ['loving-you-frozen', 'aurore-blanche'],
  },

  'amber-noir': {
    id: 'amber-noir',
    slug: 'amber-noir',
    name: 'Amber Noir',
    descriptor: 'Rich amber wrapped in midnight mystery',
    scentFamily: 'Oriental · Amber · Dark Musk',
    images: ['/images/image10.jpeg', '/images/image8.jpeg', '/images/image4.jpeg', '/images/image11.jpeg'],
    variants: [
      { size: '50ml',  price: 162000, stock: 12 },
      { size: '100ml', price: 248000, stock: 7  },
    ],
    scentNotes: {
      top:   ['Black Pepper', 'Cardamom', 'Mandarin'],
      heart: ['Amber Resin', 'Benzoin', 'Labdanum'],
      base:  ['Dark Musk', 'Oud Wood', 'Vanilla', 'Tonka'],
    },
    description: `Amber Noir is an oriental composition built entirely around a single idea: warmth. Not the bright warmth of citrus or the soft warmth of musk — but the deep, almost molten warmth of ancient resins.

Black pepper and cardamom open with a spiced clarity before dissolving almost immediately into the amber resin heart — a thick, honeyed, slightly smoky accord anchored by labdanum and benzoin. The base is dark and enveloping: oud wood and vanilla intertwined with a rich musk that brings everything into focus.

The definitive evening fragrance — worn when the sun goes down and the night is long.`,
    specs: {
      gender:        'Unisex',
      concentration: 'Eau de Parfum (EDP)',
      origin:        'UAE · France',
      longevity:     '11–14 hours',
      sillage:       'Heavy',
    },
    occasions:    ['Evening', 'Date Night', 'Special Occasion', 'Cool Weather'],
    relatedSlugs: ['oud-imperiale', 'rose-oud', 'stronger-for-you-absolute'],
    bundleSlugs:  ['rose-oud', 'oud-imperiale'],
  },
};

export function getProduct(slug: string): PDPProduct | null {
  return PRODUCTS[slug] ?? null;
}
