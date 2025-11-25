// src/ModelCapture.ts
import { WeaponManager } from "./managers/WeaponManager"
import { gameState } from "./GameState"
import { hidePauseOverlay } from "./ui/PauseOverlay"

export class ModelCapture {
  private weaponManager: WeaponManager
  private container: HTMLDivElement
  private video: HTMLVideoElement
  private button: HTMLButtonElement
  private tip: HTMLDivElement
  private count = 0
  private readonly MAX_COUNT = 3
  private readonly ENDPOINT =
    "https://triposr-api-252952730767.us-central1.run.app/reconstruct"

  constructor(weaponManager: WeaponManager) {
    this.weaponManager = weaponManager

    // === Build UI ===
    this.container = document.createElement("div")
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      background: #000;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `

    this.video = document.createElement("video")
    this.video.autoplay = true
    this.video.playsInline = true
    this.video.style.cssText = `
      width: 80%;
      max-width: 500px;
      border: 3px solid white;
      border-radius: 8px;
      object-fit: cover;
      background: black;
    `
    this.container.appendChild(this.video)

    this.tip = document.createElement("div")
    this.tip.textContent = "Align your object inside the frame"
    this.tip.style.margin = "12px"
    this.tip.style.fontSize = "18px"
    this.container.appendChild(this.tip)

    // === Existing capture button ===
  this.button = document.createElement("button")
  this.button.textContent = "Capture & Upload"
  this.button.style.cssText = `
    padding: 12px 20px;
    background: #222;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 8px;
  `
  this.container.appendChild(this.button)

  // === NEW: "Skip" button ===
  const skipBtn = document.createElement("button")
  skipBtn.textContent = "Skip (Start Game)"
  skipBtn.style.cssText = `
    padding: 10px 18px;
    background: #555;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
    margin-top: 10px;
    opacity: 0.9;
  `
  this.container.appendChild(skipBtn)

  // When skip clicked → stop camera and exit immediately
  skipBtn.onclick = () => {
    const stream = this.video.srcObject as MediaStream | null
    if (stream) stream.getTracks().forEach(t => t.stop())
    this.dispose()
  }

    document.body.appendChild(this.container)
  }

  async run(): Promise<void> {
    // Start camera preview
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width:720, height:720, facingMode: "environment"} })
    this.video.srcObject = stream

    this.button.onclick = async () => {
      if (this.count >= this.MAX_COUNT) return

      this.tip.textContent = "Capturing..."
      const img = await this.captureFrame(256)//quality size
      this.tip.textContent = "Uploading..."
      this.startUploadJob(img, this.count)

      this.count++
      if (this.count < this.MAX_COUNT) {
        this.tip.textContent = `Captured ${this.count}/3. Continue scanning...`
      } else {
        this.tip.textContent = "All objects captured. Starting AR..."
        setTimeout(() => {
          stream.getTracks().forEach((t) => t.stop())
          this.dispose()
        }, 800)
      }
    }

    // Wait until UI disposed (after 3 captures)
    await new Promise<void>((resolve) => {
      const check = () => {
        if (!document.body.contains(this.container)) resolve()
        else requestAnimationFrame(check)
      }
      check()
    })
  }

  private async captureFrame(maxSize: number): Promise<Blob> {
    const video = this.video
    const canvas = document.createElement("canvas")
    const scale = Math.min(
      1,
      maxSize / Math.max(video.videoWidth, video.videoHeight)
    )
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.9)
    )
    return blob
  }

  private startUploadJob(imageBlob: Blob, index: number) {
  ;(async () => {
    try {
      const form = new FormData();
      form.append("file", imageBlob, "input.jpg");
      console.log(`[ModelCapture] Uploading slot ${index}...`);

      // 1️⃣ 调用 /reconstruct（此处返回 JSON，不是模型）
      const resp = await fetch(this.ENDPOINT, {
        method: "POST",
        body: form,
      });

      if (!resp.ok) {
        console.error("[ModelCapture] HTTP error", resp.status);
        return;
      }

      const data = await resp.json();
      const modelUrl = data.url; // Cloud Storage 上未来的模型 URL

      console.log("[ModelCapture] Job queued, polling:", modelUrl);

      // 2️⃣ 轮询 Cloud Storage 文件是否已经生成
      const waitForModel = async () => {
        while (true) {
          try {
            const check = await fetch(modelUrl, { method: "HEAD" });
            if (check.ok) {
              console.log("[ModelCapture] Model is ready:", modelUrl);
              return true;
            }
          } catch (e) {
            // ignore (still not ready)
          }
          console.log("[ModelCapture] Model not ready yet, waiting...");
          await new Promise((r) => setTimeout(r, 2000)); // 等 2 秒
        }
      };

      await waitForModel();

      // 3️⃣ 模型准备好后，直接使用 URL 作为 GLB 路径
      await this.weaponManager.registerWeaponFromGLB(modelUrl, { scale: 0.15 });

      if (gameState.paused) {
        console.log("[ModelCapture] Model received, resuming game.");
        gameState.resume();
        hidePauseOverlay();
      }

      console.log(`[ModelCapture] Slot ${index} ready and registered.`);

    } catch (e) {
      console.error("[ModelCapture] Upload failed", e);
    }
  })();
}


  private dispose() {
    this.container.remove()
  }
}
