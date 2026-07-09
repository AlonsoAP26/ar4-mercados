const FREE_AVATARS = [
  { id: 'bot-1', name: 'Bot Ámbar', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo1' },
  { id: 'bot-2', name: 'Bot Cobalto', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo2' },
  { id: 'bot-3', name: 'Bot Esmeralda', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo3' },
  { id: 'bot-4', name: 'Bot Coral', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo4' },
  { id: 'bot-5', name: 'Bot Grafito', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo5' },
  { id: 'bot-6', name: 'Bot Plata', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo6' }
];

const PREMIUM_AVATARS = [
  { id: 'guerrero-oro', name: 'Guerrero de Oro', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Warrior1', priceSoles: 10 },
  { id: 'ninja-sombra', name: 'Ninja de la Sombra', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ninja1', priceSoles: 10 },
  { id: 'caballero-plata', name: 'Caballero de Plata', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Knight1', priceSoles: 8 },
  { id: 'mago-arcano', name: 'Mago Arcano', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mage1', priceSoles: 8 },
  { id: 'cyborg-neon', name: 'Cyborg Neón', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cyborg1', priceSoles: 10 },
  { id: 'fenix-leyenda', name: 'Fénix Leyenda', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Phoenix1', priceSoles: 10 }
];

function findAvatar(id) {
  return FREE_AVATARS.find((a) => a.id === id) || PREMIUM_AVATARS.find((a) => a.id === id);
}

function isPremiumAvatar(id) {
  return PREMIUM_AVATARS.some((a) => a.id === id);
}

module.exports = { FREE_AVATARS, PREMIUM_AVATARS, findAvatar, isPremiumAvatar };
