import type { WeaponDefinition } from '../types';

export const WEAPONS: Record<string, WeaponDefinition> = {
  slipper: { icon: '🩴', name: 'Flip-flops', animationClass: 'pd-shattering', duration: 800, particles: 'slipper' },
  spray: { icon: '🧯', name: 'Spray', animationClass: 'pd-spraying', duration: 900, particles: 'spray' },
  acid: { icon: '🧪', name: 'Acid', animationClass: 'pd-dissolving', duration: 1500, particles: 'acid' },
  flamer: { icon: '🔥', name: 'Flamer', animationClass: 'pd-burning', duration: 1200, particles: 'fire' },
  laser: { icon: '⚡', name: 'Laser', animationClass: 'pd-vaporizing', duration: 800, particles: 'spark' },
  machinegun: { icon: '🔫', name: 'Machine Gun', animationClass: 'pd-shattering', duration: 600, particles: 'bullet' },
  hammer: { icon: '🔨', name: 'Hammer', animationClass: 'pd-smashing', duration: 500, particles: 'debris' },
  meteor: { icon: '☄️', name: 'Meteor', animationClass: 'pd-meteor-hit', duration: 1000, particles: 'meteor' },
  blackhole: { icon: '🌀', name: 'Black Hole', animationClass: 'pd-blackholed', duration: 1500, particles: 'none' },
  explosion: { icon: '💥', name: 'Explosion', animationClass: 'pd-exploding', duration: 700, particles: 'explosion' },
  freeze: { icon: '🧊', name: 'Freeze', animationClass: 'pd-freezing', duration: 1200, particles: 'ice' },
  lightning: { icon: '⛈️', name: 'Lightning', animationClass: 'pd-electrified', duration: 800, particles: 'lightning' },
  tornado: { icon: '🌪️', name: 'Tornado', animationClass: 'pd-tornado', duration: 1500, particles: 'wind' },
  pixelate: { icon: '👾', name: 'Glitch', animationClass: 'pd-glitching', duration: 1000, particles: 'pixels' },
  gravity: { icon: '🕳️', name: 'Gravity', animationClass: 'pd-crushed', duration: 1000, particles: 'gravity' },
};

export const WEAPON_KEYS = Object.keys(WEAPONS);
