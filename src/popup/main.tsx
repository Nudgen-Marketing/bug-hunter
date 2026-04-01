import { render } from "preact";
import { useState, useCallback, useEffect } from "preact/hooks";
import { refreshProgressionFromStorage } from "../shared/storage";
import type { ProgressionData } from "../shared/progression";

const ACHIEVEMENT_LABELS: Record<string, string> = {
  "first-blood": "First Blood",
  "exterminator-25": "Exterminator (25 kills)",
  "clean-run": "Clean Run",
  "challenge-winner": "Challenge Winner",
  "score-5000": "5000 Score Club",
};

const WEAPONS: Record<string, { icon: string; name: string }> = {
  slipper: { icon: "🩴", name: "Flip-flops" },
  spray: { icon: "🧯", name: "Spray" },
  acid: { icon: "🧪", name: "Acid" },
  flamer: { icon: "🔥", name: "Flamer" },
  laser: { icon: "⚡", name: "Laser" },
  machinegun: { icon: "🔫", name: "Machine Gun" },
  hammer: { icon: "🔨", name: "Hammer" },
  meteor: { icon: "☄️", name: "Meteor" },
  blackhole: { icon: "🌀", name: "Black Hole" },
  explosion: { icon: "💥", name: "Explosion" },
  freeze: { icon: "🧊", name: "Freeze" },
  lightning: { icon: "⛈️", name: "Lightning" },
  tornado: { icon: "🌪️", name: "Tornado" },
  pixelate: { icon: "👾", name: "Glitch" },
  gravity: { icon: "🕳️", name: "Gravity" },
};

function App() {
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [weapon, setWeapon] = useState("slipper");
  const [muted, setMuted] = useState(false);
  const mode = "free-play" as const;
  const tool = "destroy-tools";

  useEffect(() => {
    void refreshProgressionFromStorage().then((data) => {
      setProgression(data);
    });
  }, []);

  const activate = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;

      const url = tab.url || "";
      if (
        ["chrome://", "chrome-extension://", "about:"].some((p) =>
          url.startsWith(p),
        )
      )
        return;

      chrome.runtime.sendMessage(
        { action: "activate", tabId: tab.id, weapon, mute: muted, mode, tool },
        () => window.close(),
      );
    });
  }, [weapon, muted, tool]);

  return (
    <div class="popup">
      <header class="header">
        <h1 class="title">Bug Hunter</h1>
        <p class="tagline">Time to debug the web</p>
      </header>

      {progression && (
        <div class="section">
          <div class="section-label">ACHIEVEMENTS</div>
          <div style="font-size:12px;color:#9fb1a6;line-height:1.4;">
            <div>Best Score: {progression.bestScores["free-play"]}</div>
            <div>Achievements Unlocked: {progression.achievements.length}</div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:#9fb1a6;max-height:72px;overflow:auto;">
            {progression.achievements.map((id) => (
              <div key={id}>🏅 {ACHIEVEMENT_LABELS[id] ?? id}</div>
            ))}
          </div>
        </div>
      )}

      <div class="section">
        <div class="section-label">TOOLS</div>
        <div class="weapon-grid">
          {Object.entries(WEAPONS).map(([id, { icon, name }]) => (
            <button
              key={id}
              class={`weapon-btn ${weapon === id ? "active" : ""}`}
              title={name}
              onClick={() => setWeapon(id)}
            >
              <span class="btn-icon">{icon}</span>
            </button>
          ))}
        </div>
      </div>

      <footer class="footer">
        <label class="mute-toggle">
          <input
            type="checkbox"
            checked={!muted}
            onChange={(e) => setMuted(!(e.target as HTMLInputElement).checked)}
          />
          <span class="mute-label">
            {muted ? "🔇 Sound off" : "🔊 Sound on"}
          </span>
        </label>
        <button class="start-btn" onClick={activate}>
          Start Hunting
        </button>
      </footer>
    </div>
  );
}

render(<App />, document.getElementById("root")!);
