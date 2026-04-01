import { WEAPONS } from './weapons';

function spawnFire(container: HTMLElement, x: number, y: number): void {
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'pd-fire-particle';
    p.style.left = `${x + 60 * (Math.random() - 0.5)}px`;
    p.style.top = `${y + 60 * (Math.random() - 0.5)}px`;
    p.style.width = `${10 + 20 * Math.random()}px`;
    p.style.height = p.style.width;
    p.style.animationDuration = `${0.5 + 0.5 * Math.random()}s`;
    container.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const smoke = document.createElement('div');
      smoke.className = 'pd-smoke';
      smoke.style.left = `${x + 40 * (Math.random() - 0.5)}px`;
      smoke.style.top = `${y}px`;
      container.appendChild(smoke);
      setTimeout(() => smoke.remove(), 2000);
    }, 100 * i);
  }
}

function spawnSpray(container: HTMLElement, x: number, y: number): void {
  const coreMist = document.createElement('div');
  coreMist.className = 'pd-spray-mist';
  coreMist.style.left = `${x}px`;
  coreMist.style.top = `${y}px`;
  container.appendChild(coreMist);
  setTimeout(() => coreMist.remove(), 1100);

  const puffCount = 20;
  for (let i = 0; i < puffCount; i++) {
    const puff = document.createElement('div');
    puff.className = 'pd-spray-droplet';
    puff.style.left = `${x}px`;
    puff.style.top = `${y}px`;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.0;
    const distance = 25 + Math.random() * 110;
    const tx = x + Math.cos(angle) * distance + (Math.random() - 0.5) * 40;
    const ty = y + Math.sin(angle) * distance - (15 + Math.random() * 35);

    puff.animate(
      [
        { left: `${x}px`, top: `${y}px`, opacity: 0.85, transform: 'scale(0.7)' },
        { left: `${tx}px`, top: `${ty}px`, opacity: 0, transform: 'scale(2.1)' },
      ],
      {
        duration: 620 + Math.random() * 420,
        easing: 'cubic-bezier(0.18, 0.7, 0.27, 1)',
      },
    );

    container.appendChild(puff);
    setTimeout(() => puff.remove(), 1200);
  }
}

function spawnSlipper(container: HTMLElement, x: number, y: number): void {
  const slipper = document.createElement('div');
  slipper.className = 'pd-slipper-projectile';
  slipper.textContent = '🩴';

  const fromLeft = Math.random() < 0.5;
  const startX = fromLeft
    ? x - (220 + Math.random() * 220)
    : x + (220 + Math.random() * 220);
  const startY = window.innerHeight + 80;

  slipper.style.left = `${startX}px`;
  slipper.style.top = `${startY}px`;
  container.appendChild(slipper);

  slipper.animate(
    [
      { left: `${startX}px`, top: `${startY}px`, transform: 'translate(-50%, -50%) rotate(0deg) scale(0.8)' },
      { left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%) rotate(760deg) scale(1.1)' },
    ],
    {
      duration: 430,
      easing: 'cubic-bezier(0.18, 0.72, 0.22, 1)',
      fill: 'forwards',
    },
  ).onfinish = () => {
    slipper.remove();

    const crack = document.createElement('div');
    crack.className = 'pd-glass-crack';
    crack.style.left = `${x}px`;
    crack.style.top = `${y}px`;
    container.appendChild(crack);

    for (let i = 0; i < 14; i++) {
      const shard = document.createElement('div');
      shard.className = 'pd-glass-shard';
      shard.style.left = `${x}px`;
      shard.style.top = `${y}px`;
      container.appendChild(shard);

      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 120;
      const tx = x + Math.cos(angle) * dist;
      const ty = y + Math.sin(angle) * dist;
      const rot = (Math.random() - 0.5) * 540;

      shard.animate(
        [
          { left: `${x}px`, top: `${y}px`, opacity: 0.9, transform: 'translate(-50%, -50%) rotate(0deg) scale(1)' },
          { left: `${tx}px`, top: `${ty}px`, opacity: 0, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(0.4)` },
        ],
        {
          duration: 450 + Math.random() * 380,
          easing: 'ease-out',
        },
      );
      setTimeout(() => shard.remove(), 900);
    }

    const impact = document.createElement('div');
    impact.className = 'pd-shockwave';
    impact.style.left = `${x}px`;
    impact.style.top = `${y}px`;
    impact.style.borderColor = 'rgba(220, 240, 255, 0.75)';
    impact.style.borderWidth = '3px';
    container.appendChild(impact);
    setTimeout(() => impact.remove(), 520);
  };
}

function spawnDebris(container: HTMLElement, x: number, y: number, rect?: DOMRect): void {
  const colors = ['#666', '#888', '#444', '#555'];
  for (let i = 0; i < 12; i++) {
    const debris = document.createElement('div');
    debris.className = 'pd-debris';
    debris.style.left = `${x + (Math.random() - 0.5) * (rect?.width || 100)}px`;
    debris.style.top = `${y + (Math.random() - 0.5) * (rect?.height || 50)}px`;
    debris.style.width = `${5 + 15 * Math.random()}px`;
    debris.style.height = `${5 + 15 * Math.random()}px`;
    debris.style.background = colors[Math.floor(Math.random() * colors.length)];
    debris.style.transform = `rotate(${360 * Math.random()}deg)`;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const distance = 50 + 150 * Math.random();
    const targetX = parseFloat(debris.style.left) + Math.cos(angle) * distance * (Math.random() > 0.5 ? 1 : -1);
    const targetY = parseFloat(debris.style.top) + Math.sin(angle) * distance + 200;

    debris.animate(
      [
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${targetX - parseFloat(debris.style.left)}px, ${targetY - parseFloat(debris.style.top)}px) rotate(${720 * (Math.random() > 0.5 ? 1 : -1)}deg)`,
          opacity: 0,
        },
      ],
      { duration: 800 + 400 * Math.random(), easing: 'ease-in' },
    );

    container.appendChild(debris);
    setTimeout(() => debris.remove(), 1200);
  }

  const shockwave = document.createElement('div');
  shockwave.className = 'pd-shockwave';
  shockwave.style.left = `${x}px`;
  shockwave.style.top = `${y}px`;
  container.appendChild(shockwave);
  setTimeout(() => shockwave.remove(), 500);
}

function spawnSpark(container: HTMLElement, x: number, y: number): void {
  for (let i = 0; i < 20; i++) {
    const spark = document.createElement('div');
    spark.className = 'pd-spark-particle';

    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + 100 * Math.random();
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;

    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.animate(
      [
        { left: `${x}px`, top: `${y}px`, opacity: 1 },
        { left: `${targetX}px`, top: `${targetY}px`, opacity: 0 },
      ],
      { duration: 300 + 200 * Math.random(), easing: 'ease-out' },
    );

    container.appendChild(spark);
    setTimeout(() => spark.remove(), 500);
  }

  const beam = document.createElement('div');
  beam.className = 'pd-laser-beam';
  beam.style.left = '0';
  beam.style.top = `${y}px`;
  beam.style.width = `${x}px`;
  container.appendChild(beam);
  setTimeout(() => beam.remove(), 300);
}

function spawnBullet(container: HTMLElement, x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const hole = document.createElement('div');
      hole.className = 'pd-bullet-hole';
      hole.style.left = `${x + 50 * (Math.random() - 0.5)}px`;
      hole.style.top = `${y + 50 * (Math.random() - 0.5)}px`;
      container.appendChild(hole);
      setTimeout(() => hole.remove(), 2000);

      for (let j = 0; j < 3; j++) {
        const spark = document.createElement('div');
        spark.className = 'pd-spark-particle';
        spark.style.left = hole.style.left;
        spark.style.top = hole.style.top;
        spark.style.background = '#ffaa00';

        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + 30 * Math.random();
        spark.animate(
          [
            { transform: 'translate(0, 0)', opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
              opacity: 0,
            },
          ],
          { duration: 200 },
        );

        container.appendChild(spark);
        setTimeout(() => spark.remove(), 200);
      }
    }, 50 * i);
  }
}

function spawnMeteor(container: HTMLElement, x: number, y: number): void {
  const meteor = document.createElement('div');
  meteor.className = 'pd-meteor';
  const startX = x - 200;
  meteor.style.left = `${startX}px`;
  meteor.style.top = '-100px';
  container.appendChild(meteor);

  meteor.animate(
    [
      { left: `${startX}px`, top: '-100px', transform: 'scale(0.5)' },
      { left: `${x - 30}px`, top: `${y - 30}px`, transform: 'scale(1)' },
    ],
    { duration: 500, easing: 'ease-in', fill: 'forwards' },
  );

  setTimeout(() => {
    meteor.remove();

    const flash = document.createElement('div');
    flash.className = 'pd-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    const shockwave = document.createElement('div');
    shockwave.className = 'pd-shockwave';
    shockwave.style.left = `${x}px`;
    shockwave.style.top = `${y}px`;
    shockwave.style.borderColor = '#ff6600';
    shockwave.style.borderWidth = '5px';
    container.appendChild(shockwave);
    setTimeout(() => shockwave.remove(), 500);

    spawnFire(container, x, y);
    spawnDebris(container, x, y, new DOMRect(0, 0, 150, 100));
  }, 500);
}

function spawnExplosion(container: HTMLElement, x: number, y: number): void {
  const flash = document.createElement('div');
  flash.className = 'pd-flash';
  flash.style.background = '#ff6600';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 300);

  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const shockwave = document.createElement('div');
      shockwave.className = 'pd-shockwave';
      shockwave.style.left = `${x}px`;
      shockwave.style.top = `${y}px`;
      shockwave.style.borderColor = `hsl(${30 - 10 * i}, 100%, 50%)`;
      container.appendChild(shockwave);
      setTimeout(() => shockwave.remove(), 500);
    }, 100 * i);
  }

  spawnFire(container, x, y);
  spawnDebris(container, x, y, new DOMRect(0, 0, 200, 150));
}

function spawnAcid(container: HTMLElement, x: number, y: number): void {
  for (let i = 0; i < 10; i++) {
    const blob = document.createElement('div');
    blob.className = 'pd-fire-particle';
    blob.style.background = 'radial-gradient(circle, #00ff00 0%, #008800 50%, transparent 100%)';
    blob.style.left = `${x + 80 * (Math.random() - 0.5)}px`;
    blob.style.top = `${y + 80 * (Math.random() - 0.5)}px`;
    blob.style.width = `${15 + 15 * Math.random()}px`;
    blob.style.height = blob.style.width;
    blob.style.boxShadow = '0 0 10px #00ff00';
    container.appendChild(blob);
    setTimeout(() => blob.remove(), 1000);
  }

  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const bubble = document.createElement('div');
      bubble.className = 'pd-spark-particle';
      bubble.style.background = '#00ff00';
      bubble.style.boxShadow = '0 0 5px #00ff00';
      bubble.style.left = `${x + 60 * (Math.random() - 0.5)}px`;
      bubble.style.top = `${y + 60 * (Math.random() - 0.5)}px`;
      bubble.style.width = `${3 + 6 * Math.random()}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.borderRadius = '50%';
      bubble.animate(
        [
          { transform: 'translateY(0) scale(1)', opacity: 1 },
          { transform: 'translateY(-50px) scale(0)', opacity: 0 },
        ],
        { duration: 500 + 500 * Math.random() },
      );
      container.appendChild(bubble);
      setTimeout(() => bubble.remove(), 1000);
    }, 50 * i);
  }
}

function spawnIce(container: HTMLElement, x: number, y: number): void {
  for (let i = 0; i < 15; i++) {
    const crystal = document.createElement('div');
    crystal.className = 'pd-ice-crystal';
    const angle = (i / 15) * Math.PI * 2;
    const dist = 30 + 50 * Math.random();
    crystal.style.left = `${x + Math.cos(angle) * dist}px`;
    crystal.style.top = `${y + Math.sin(angle) * dist}px`;
    crystal.style.transform = `rotate(${360 * Math.random()}deg)`;
    container.appendChild(crystal);
    setTimeout(() => crystal.remove(), 1500);
  }

  const ring = document.createElement('div');
  ring.className = 'pd-frost-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  container.appendChild(ring);
  setTimeout(() => ring.remove(), 800);

  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'pd-ice-sparkle';
    sparkle.style.left = `${x + 100 * (Math.random() - 0.5)}px`;
    sparkle.style.top = `${y + 100 * (Math.random() - 0.5)}px`;
    sparkle.style.animationDelay = `${0.5 * Math.random()}s`;
    container.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1200);
  }
}

function spawnLightning(container: HTMLElement, x: number, y: number): void {
  const flash = document.createElement('div');
  flash.className = 'pd-flash';
  flash.style.background = '#ffffff';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 100);

  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const bolt = document.createElement('div');
      bolt.className = 'pd-lightning-bolt';
      bolt.style.left = `${x + 60 * (Math.random() - 0.5)}px`;
      bolt.style.top = `${y - 200}px`;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '60');
      svg.setAttribute('height', '220');
      svg.style.position = 'absolute';
      svg.style.overflow = 'visible';

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d = 'M30,0';
      let px = 30;
      let py = 0;
      for (let j = 0; j < 8; j++) {
        px += 40 * (Math.random() - 0.5);
        py += 25 + 10 * Math.random();
        d += ` L${px},${py}`;
      }
      path.setAttribute('d', d);
      path.setAttribute('stroke', '#ffffff');
      path.setAttribute('stroke-width', '3');
      path.setAttribute('fill', 'none');
      path.setAttribute('filter', 'drop-shadow(0 0 10px #00aaff) drop-shadow(0 0 20px #0066ff)');

      svg.appendChild(path);
      bolt.appendChild(svg);
      container.appendChild(bolt);
      setTimeout(() => bolt.remove(), 300);
    }, 100 * i);
  }

  for (let i = 0; i < 25; i++) {
    const spark = document.createElement('div');
    spark.className = 'pd-electric-spark';
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + 80 * Math.random();
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.animate(
      [
        { left: `${x}px`, top: `${y}px`, opacity: 1 },
        { left: `${x + Math.cos(angle) * dist}px`, top: `${y + Math.sin(angle) * dist}px`, opacity: 0 },
      ],
      { duration: 200 + 200 * Math.random() },
    );
    container.appendChild(spark);
    setTimeout(() => spark.remove(), 400);
  }
}

function spawnWind(container: HTMLElement, x: number, y: number): void {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      for (let j = 0; j < 8; j++) {
        const p = document.createElement('div');
        p.className = 'pd-wind-particle';
        const angle = (j / 8) * Math.PI * 2;
        const radius = 30 + 20 * i;
        p.style.left = `${x + Math.cos(angle) * radius}px`;
        p.style.top = `${y + Math.sin(angle) * radius - 30 * i}px`;
        p.animate(
          [
            { transform: 'rotate(0deg) scale(1)', opacity: 0.8 },
            { transform: 'rotate(720deg) scale(0)', opacity: 0 },
          ],
          { duration: 1000 + 200 * i, easing: 'ease-in' },
        );
        container.appendChild(p);
        setTimeout(() => p.remove(), 1200 + 200 * i);
      }
    }, 100 * i);
  }

  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const debris = document.createElement('div');
      debris.className = 'pd-tornado-debris';
      debris.style.left = `${x + 100 * (Math.random() - 0.5)}px`;
      debris.style.top = `${y + 60 * (Math.random() - 0.5)}px`;
      debris.style.width = `${5 + 10 * Math.random()}px`;
      debris.style.height = `${5 + 10 * Math.random()}px`;

      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + 150 * Math.random();
      debris.animate(
        [
          { transform: 'rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * dist}px, ${-dist + 50 * Math.sin(angle)}px) rotate(${1080 * (Math.random() > 0.5 ? 1 : -1)}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1200 + 500 * Math.random(), easing: 'ease-out' },
      );

      container.appendChild(debris);
      setTimeout(() => debris.remove(), 1700);
    }, 50 * i);
  }

  const vortex = document.createElement('div');
  vortex.className = 'pd-vortex';
  vortex.style.left = `${x}px`;
  vortex.style.top = `${y}px`;
  container.appendChild(vortex);
  setTimeout(() => vortex.remove(), 1500);
}

function spawnPixels(container: HTMLElement, x: number, y: number): void {
  const glitch = document.createElement('div');
  glitch.className = 'pd-glitch-flash';
  glitch.style.left = `${x - 75}px`;
  glitch.style.top = `${y - 75}px`;
  container.appendChild(glitch);
  setTimeout(() => glitch.remove(), 500);

  const colors = ['#ff0055', '#00ff88', '#0088ff', '#ffff00', '#ff00ff', '#00ffff'];
  for (let i = 0; i < 40; i++) {
    const px = document.createElement('div');
    px.className = 'pd-pixel';
    px.style.left = `${x + 80 * (Math.random() - 0.5)}px`;
    px.style.top = `${y + 80 * (Math.random() - 0.5)}px`;
    px.style.background = colors[Math.floor(Math.random() * colors.length)];
    px.style.width = `${4 + 8 * Math.random()}px`;
    px.style.height = px.style.width;

    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + 100 * Math.random();
    px.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`,
          opacity: 0,
        },
      ],
      { duration: 500 + 500 * Math.random(), easing: 'steps(5)' },
    );

    container.appendChild(px);
    setTimeout(() => px.remove(), 1000);
  }

  for (let i = 0; i < 5; i++) {
    const scan = document.createElement('div');
    scan.className = 'pd-scanline';
    scan.style.left = `${x - 100}px`;
    scan.style.top = `${y - 50 + 25 * i}px`;
    scan.style.animationDelay = `${0.1 * i}s`;
    container.appendChild(scan);
    setTimeout(() => scan.remove(), 600);
  }
}

function spawnGravity(container: HTMLElement, x: number, y: number): void {
  const well = document.createElement('div');
  well.className = 'pd-gravity-well';
  well.style.left = `${x}px`;
  well.style.top = `${y}px`;
  container.appendChild(well);
  setTimeout(() => well.remove(), 1000);

  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'pd-gravity-particle';
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + 120 * Math.random();
    const fromX = x + Math.cos(angle) * dist;
    const fromY = y + Math.sin(angle) * dist;
    p.style.left = `${fromX}px`;
    p.style.top = `${fromY}px`;
    p.style.width = `${3 + 6 * Math.random()}px`;
    p.style.height = p.style.width;
    p.animate(
      [
        { left: `${fromX}px`, top: `${fromY}px`, opacity: 0.8, transform: 'scale(1)' },
        { left: `${x}px`, top: `${y}px`, opacity: 0, transform: 'scale(0)' },
      ],
      { duration: 600 + 400 * Math.random(), easing: 'ease-in' },
    );

    container.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }

  for (let i = 0; i < 6; i++) {
    const crack = document.createElement('div');
    crack.className = 'pd-gravity-crack';
    const angle = (i / 6) * Math.PI * 2;
    crack.style.left = `${x}px`;
    crack.style.top = `${y}px`;
    crack.style.transform = `rotate(${angle}rad)`;
    container.appendChild(crack);
    setTimeout(() => crack.remove(), 1000);
  }
}

const PARTICLE_EFFECTS: Record<string, (container: HTMLElement, x: number, y: number, rect?: DOMRect) => void> = {
  spray: (container, x, y) => spawnSpray(container, x, y),
  slipper: (container, x, y) => spawnSlipper(container, x, y),
  fire: (container, x, y) => spawnFire(container, x, y),
  spark: (container, x, y) => spawnSpark(container, x, y),
  bullet: (container, x, y) => spawnBullet(container, x, y),
  debris: (container, x, y, rect) => spawnDebris(container, x, y, rect),
  meteor: (container, x, y) => spawnMeteor(container, x, y),
  explosion: (container, x, y) => spawnExplosion(container, x, y),
  acid: (container, x, y) => spawnAcid(container, x, y),
  ice: (container, x, y) => spawnIce(container, x, y),
  lightning: (container, x, y) => spawnLightning(container, x, y),
  wind: (container, x, y) => spawnWind(container, x, y),
  pixels: (container, x, y) => spawnPixels(container, x, y),
  gravity: (container, x, y) => spawnGravity(container, x, y),
};

export function playLegacyWeaponEffect(
  container: HTMLElement,
  weaponId: string,
  x: number,
  y: number,
  rect?: DOMRect,
): void {
  const weapon = WEAPONS[weaponId];
  if (!weapon) return;
  const fx = PARTICLE_EFFECTS[weapon.particles];
  if (fx) fx(container, x, y, rect);
}

export function spawnLegacyRuins(container: HTMLElement, rect: DOMRect): void {
  const count = 3 + Math.floor(4 * Math.random());
  for (let i = 0; i < count; i++) {
    const ruin = document.createElement('div');
    ruin.className = 'pd-ruins';
    ruin.style.position = 'fixed';
    ruin.style.left = `${rect.left + Math.random() * rect.width * 0.8}px`;
    ruin.style.top = `${rect.top + Math.random() * rect.height * 0.8}px`;
    ruin.style.width = `${10 + 30 * Math.random()}px`;
    ruin.style.height = `${5 + 15 * Math.random()}px`;
    ruin.style.transform = `rotate(${30 * Math.random() - 15}deg)`;
    container.appendChild(ruin);
  }
}
