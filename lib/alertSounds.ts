// lib/alertSounds.ts
//
// Order alert sounds, generated with WebAudio rather than shipped as files.
// Nothing to download, nothing to 404, and it plays instantly.
//
// Designed for a noisy takeaway: a charcoal grill, an extractor fan and a
// queue. Two things make an alert cut through that — a REPEATING pattern
// (one beep gets missed, three don't) and frequencies around 2-4kHz, where
// human hearing is most sensitive and kitchen rumble isn't.

export type AlertSoundId = "double" | "triple" | "klaxon" | "chime" | "bell";

export const ALERT_SOUNDS: { id: AlertSoundId; label: string; note: string }[] = [
  { id: "triple", label: "Triple pulse", note: "Loudest. Hard to miss." },
  { id: "klaxon", label: "Klaxon", note: "Harsh buzzer. Cuts through anything." },
  { id: "double", label: "Double beep", note: "Clear, less aggressive." },
  { id: "bell", label: "Counter bell", note: "Sharp ding, familiar." },
  { id: "chime", label: "Rising chime", note: "Gentlest. Quiet rooms only." },
];

export const DEFAULT_SOUND: AlertSoundId = "triple";

type Ctx = AudioContext;

function tone(
  ctx: Ctx,
  at: number,
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  peak = 0.32
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  osc.connect(gain);
  gain.connect(ctx.destination);
  // Ramp rather than switch: an instant gain change clicks audibly.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

function sweep(ctx: Ctx, at: number, from: number, to: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.linearRampToValueAtTime(to, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.34, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/** Play an alert. Safe to call anywhere — failures are swallowed. */
export function playAlert(id: AlertSoundId = DEFAULT_SOUND): void {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const t = ctx.currentTime + 0.02;

    switch (id) {
      case "triple":
        // Three hits at 2.6kHz. Repetition is what defeats background noise.
        tone(ctx, t, 2600, 0.11);
        tone(ctx, t + 0.17, 2600, 0.11);
        tone(ctx, t + 0.34, 2600, 0.2);
        break;

      case "klaxon":
        // Two harsh falling sweeps — deliberately unpleasant, so it's noticed.
        sweep(ctx, t, 1400, 700, 0.26);
        sweep(ctx, t + 0.3, 1400, 700, 0.32);
        break;

      case "double":
        tone(ctx, t, 1800, 0.13);
        tone(ctx, t + 0.2, 2400, 0.22);
        break;

      case "bell":
        // Two sine partials = a metallic ding without a sample.
        tone(ctx, t, 3100, 0.5, "sine", 0.3);
        tone(ctx, t + 0.005, 4300, 0.38, "sine", 0.15);
        break;

      case "chime":
        tone(ctx, t, 1320, 0.16, "sine", 0.26);
        tone(ctx, t + 0.14, 1760, 0.16, "sine", 0.26);
        tone(ctx, t + 0.28, 2640, 0.42, "sine", 0.26);
        break;
    }

    // Free the context once it has finished.
    window.setTimeout(() => ctx.close().catch(() => {}), 1800);
  } catch {
    // A missing alert should never break the board.
  }
}
