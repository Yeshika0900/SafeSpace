import {
  INFERENCE,
  loadObjectModel,
  type ObjectModel,
  type Observation,
} from "./inference";
export type CameraState = {
  pending: boolean;
  active: boolean;
  loading: boolean;
  pred: Observation[];
  message: string;
  error: string;
};
const off = (): CameraState => ({
  pending: false,
  active: false,
  loading: false,
  pred: [],
  message: "Camera is off.",
  error: "",
});
type Session = {
  cancelled: boolean;
  stream?: MediaStream;
  model?: ObjectModel;
  timer?: ReturnType<typeof setTimeout>;
  inFlight: boolean;
};
// TensorFlow work from a cancelled tool may still be finishing after remount.
let inferenceBusy = false;
export class CameraSession {
  private current?: Session;
  private state = off();
  constructor(
    private video: () => HTMLVideoElement | null,
    private notify: (state: CameraState) => void,
    private acquire = () =>
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      }),
    private load: () => Promise<ObjectModel> = loadObjectModel,
  ) {}
  private update(patch: Partial<CameraState>) {
    this.state = { ...this.state, ...patch };
    this.notify(this.state);
  }
  private live(s: Session) {
    return this.current === s && !s.cancelled;
  }
  private dispose(s: Session) {
    if (s.model && !s.inFlight) {
      s.model.dispose();
      s.model = undefined;
    }
  }
  stop() {
    const s = this.current;
    this.current = undefined;
    if (s) {
      s.cancelled = true;
      clearTimeout(s.timer);
      s.stream?.getTracks().forEach((t) => t.stop());
      this.dispose(s);
    }
    const v = this.video();
    if (v) v.srcObject = null;
    this.state = off();
    this.notify(this.state);
  }
  destroy() {
    this.notify = () => {};
    this.stop();
  }
  async start() {
    this.stop();
    const s: Session = { cancelled: false, inFlight: false };
    this.current = s;
    this.update({ pending: true, message: "Waiting for camera permission..." });
    try {
      const stream = await this.acquire();
      if (!this.live(s)) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      s.stream = stream;
      const v = this.video();
      if (!v) throw new Error("Preview unavailable.");
      v.srcObject = stream;
      await v.play();
      if (!this.live(s)) return;
      this.update({
        pending: false,
        active: true,
        loading: true,
        message: "Loading object recognition model...",
      });
      try {
        const model = await this.load();
        s.model = model;
        if (!this.live(s)) {
          this.dispose(s);
          return;
        }
        this.update({
          loading: false,
          message: "Model ready. Scanning for common objects...",
        });
        void this.detect(s);
      } catch {
        if (this.live(s))
          this.update({
            loading: false,
            pred: [],
            error:
              "Object recognition could not load. Camera preview and frame capture are still available.",
            message: "Preview available; object recognition unavailable.",
          });
      }
    } catch {
      if (this.live(s)) {
        this.stop();
        this.update({
          error:
            "Could not start camera. Check camera permission and use HTTPS or localhost.",
        });
      }
    }
  }
  private async detect(s: Session) {
    if (!this.live(s)) return;
    try {
      const v = this.video();
      if (!inferenceBusy && v && v.readyState >= 2 && s.model) {
        inferenceBusy = true;
        s.inFlight = true;
        try {
          const predictions = await s.model.detect(
            v,
            INFERENCE.maxPredictions,
            INFERENCE.minScore,
          );
          if (this.live(s))
            this.update({
              pred: predictions.slice(0, INFERENCE.displayCap),
              error: "",
              message: predictions.length
                ? `Observed ${predictions.length} common object(s); showing up to ${INFERENCE.displayCap}.`
                : "No common objects recognised in this frame.",
            });
        } finally {
          inferenceBusy = false;
          s.inFlight = false;
        }
      }
    } catch {
      if (this.live(s))
        this.update({
          pred: [],
          error: "Object recognition failed for this frame.",
          message:
            "Current object observations unavailable; preview remains active.",
        });
    } finally {
      if (this.live(s))
        s.timer = setTimeout(() => void this.detect(s), INFERENCE.intervalMs);
      else this.dispose(s);
    }
  }
}
