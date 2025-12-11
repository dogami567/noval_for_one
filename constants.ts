import { Location, Character, ChronicleEntry } from './types';

export const LOCATIONS: Location[] = [
  {
    id: 'loc_1',
    name: 'The Whispering Spire',
    type: 'mystic',
    x: 25,
    y: 30,
    description: 'An ancient tower that pierces the clouds, vibrating with forgotten songs.',
    lore: 'Legend says the Spire was not built, but grown from a single crystal seed by the Star-Architects. Travelers report hearing the voices of their ancestors when touching its obsidian walls.',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    status: 'unlocked'
  },
  {
    id: 'loc_2',
    name: 'Ironclad Bastion',
    type: 'city',
    x: 65,
    y: 55,
    description: 'The last stronghold of the crimson legion, powered by steam and runic magic.',
    lore: 'Built atop a dormant volcano, the Bastion harnesses geothermal energy to power its massive forges. It represents the pinnacle of mortal engineering in an age of declining magic.',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    status: 'unlocked'
  },
  {
    id: 'loc_3',
    name: 'Sylvaneth Grove',
    type: 'nature',
    x: 80,
    y: 20,
    description: 'A bioluminescent forest where time flows differently.',
    lore: 'The trees here bleed silver sap, and the fireflies are said to be the souls of lost wanderers. It is forbidden to carry iron into the Grove.',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    status: 'locked'
  },
  {
    id: 'loc_4',
    name: 'Ruins of Aethelgard',
    type: 'ruin',
    x: 40,
    y: 80,
    description: 'Shattered remnants of a once-great civilization, now reclaimed by the sea.',
    lore: 'Aethelgard fell in a single night during the Great Cataclysm. Now, only scavengers and brave historians dare to explore its waterlogged halls looking for artifacts.',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    status: 'locked'
  },
];

export const INITIAL_WELCOME_MESSAGE = "Greetings, traveler. I am the Keeper of Chronicles. What knowledge of this realm do you seek today?";

export const CHARACTERS: Character[] = [
  {
    id: 'char_1',
    name: 'Mel, The Void Walker',
    title: 'Glimmering Shadow',
    faction: 'The Whispering Spire',
    description: 'A mage who traded her sight for the ability to perceive the ley lines of the world.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Senna_0.jpg',
    lore: 'Born in the heart of the Spire, Mel was never like the others. She could hear the stones singing before she could walk. When the Void touched the northern lands, she was the first to answer the call, merging her essence with the shadows to protect the light.',
    stories: [
        { title: 'The First Step', excerpt: 'How Mel abandoned her family name to serve the Spire.' },
        { title: 'Echoes of Silence', excerpt: 'A confrontation with the silence of the Void.' }
    ]
  },
  {
    id: 'char_2',
    name: 'Viktor, The Herald',
    title: 'Arcane Pioneer',
    faction: 'Ironclad Bastion',
    description: 'He believes technology is the only shield against the coming darkness.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Viktor_1.jpg',
    lore: 'Flesh is weak, but steel is eternal. Viktor saw the frailty of his people during the Plague of Rust and vowed to ascend them. Now, half-machine and fully driven, he leads the Bastion into a new age of mechanical evolution.',
    stories: [
        { title: 'Glorious Evolution', excerpt: 'The day the forges ran cold, and Viktor reignited them with his own spark.' }
    ]
  },
  {
    id: 'char_3',
    name: 'Ambessa',
    title: 'Matriarch of War',
    faction: 'Noxus Prime',
    description: 'A ruthless tactician who would burn the world to save her lineage.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ambessa_0.jpg',
    lore: 'Ambessa knows only one truth: strength is survival. She has commanded armies, toppled kings, and sacrificed everything for her clan. Now, she looks toward the ancient magic of Aetheria as a weapon to be seized.',
    stories: [
        { title: 'Blood and Iron', excerpt: 'A lesson taught to her children on the battlefield.' },
        { title: 'The Wolfs Bargain', excerpt: 'A secret pact made in the depths of winter.' }
    ]
  },
  {
    id: 'char_4',
    name: 'Teemo',
    title: 'Swift Scout',
    faction: 'Bandle City',
    description: 'Small, furry, and surprisingly deadly.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Teemo_0.jpg',
    lore: 'Do not let his size deceive you. Teemo traverses the poisonous jungles of Kumungu with a smile. He is the guardian of the hidden pathways, and his darts never miss.',
    stories: [
        { title: 'The Mushroom War', excerpt: 'How one scout held back an entire battalion.' }
    ]
  },
  {
    id: 'char_5',
    name: 'Aurora',
    title: 'Spirit Walker',
    faction: 'Freljord',
    description: 'She dances between the realms of the living and the spirit world.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aurora_0.jpg',
    lore: 'Aurora sees the world not as it is, but as it could be. The spirits guide her steps, allowing her to traverse great distances in the blink of an eye. She seeks to heal the rift between the material and the ethereal.',
    stories: []
  }
];

export const CHRONICLES: ChronicleEntry[] = [
  {
    id: 'entry_1',
    title: 'The Awakening',
    date: 'Era 4, Year 202',
    summary: 'The dormant Ley Lines beneath the Whispering Spire have begun to pulse with a chaotic rhythm. Something is waking beneath the earth.',
    status: 'completed'
  },
  {
    id: 'entry_2',
    title: 'The Crimson Treaty',
    date: 'Era 4, Year 203',
    summary: 'General Vora has called for a summit at the Ironclad Bastion. The factions debate the use of ancient technology to combat the void.',
    status: 'active'
  },
  {
    id: 'entry_3',
    title: 'Shadows in the Grove',
    date: 'Era 4, Year 204',
    summary: 'Reports of shadow creatures emerging from the Sylvaneth Grove. The Grove Keeper remains silent.',
    status: 'pending'
  }
];