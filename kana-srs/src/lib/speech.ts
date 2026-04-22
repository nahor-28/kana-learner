let jaVoice: SpeechSynthesisVoice | null | undefined = undefined;
let warnedOnce = false;

function getJaVoice(): SpeechSynthesisVoice | null {
  if (jaVoice !== undefined) return jaVoice;
  if (typeof speechSynthesis === 'undefined') {
    jaVoice = null;
    return null;
  }
  const voices = speechSynthesis.getVoices();
  jaVoice = voices.find(v => v.lang.startsWith('ja')) ?? null;
  return jaVoice;
}

export function speak(text: string): void {
  const voice = getJaVoice();
  if (!voice) {
    if (!warnedOnce) {
      console.log('[speech] No ja-JP voice available — audio disabled');
      warnedOnce = true;
    }
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = voice;
  utter.lang = 'ja-JP';
  utter.rate = 0.8;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

export function hasJaVoice(): boolean {
  return getJaVoice() !== null;
}

// Voices load asynchronously on some browsers — call this once on app init
export function loadVoices(): void {
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = () => {
      jaVoice = undefined; // reset cache so next call re-queries
    };
    getJaVoice(); // warm the cache
  }
}
