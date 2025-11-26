// src/ui/PauseOverlay.ts
import * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

let texture: GUI.AdvancedDynamicTexture | null = null
let spinner: GUI.Image | null = null

// 初始化，一次就够（在 main.ts 里调用）
export function initPauseOverlay(scene: BABYLON.Scene) {
  if (texture) return // already inited

  texture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("pauseUI", true, scene)
  texture.isForeground = true
  texture.idealHeight = 1080

  const bg = new GUI.Rectangle("pauseBG")
  bg.width = "100%"
  bg.height = "100%"
  bg.background = "rgba(251, 248, 228, 1)"
  bg.isPointerBlocker = true   // 暂停时挡住点击
  texture.addControl(bg)

  const text = new GUI.TextBlock("pauseText", "Weapon upgrading...")
  text.color = "black"
  text.fontSize = 32
  text.top = "-100px"
  texture.addControl(text)

  const basePath = window.location.origin + (window.location.pathname.includes('webarfps') ? '/webarfps/' : '/'); 
  const img = new GUI.Image("cornerImg", `${basePath}textures/bg1.png`)
  img.width = "280px"
  img.height = "280px"
  //img.left = "-100px"
  img.top = "280px"
  texture.addControl(img)

  spinner = new GUI.Image("spinner", `${basePath}textures/spinner.png`)
  spinner.width = "80px"
  spinner.height = "80px"
  texture.addControl(spinner)

  // 旋转动画
  scene.onBeforeRenderObservable.add(() => {
    if (!texture || !texture.rootContainer.isVisible || !spinner) return
    spinner.rotation += 0.1
  })

  texture.rootContainer.isVisible = false
}

export function showPauseOverlay() {
  if (!texture) return
  texture.rootContainer.isVisible = true
}

export function hidePauseOverlay() {
  if (!texture) return
  texture.rootContainer.isVisible = false
}
