// src/ui/EndGameUI.ts
import * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"

let ui: GUI.AdvancedDynamicTexture | null = null
let message: GUI.TextBlock | null = null
let message2: GUI.TextBlock | null = null
let bg: GUI.Rectangle | null = null
let restartBtn: GUI.Button | null = null
let img1: GUI.Image | null = null
let img2: GUI.Image | null = null

export function initEndGameUI(scene: BABYLON.Scene, onRestart: () => void) {
  if (ui) return // Already initialized

  ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("endGameUI", true, scene)

  // 背景
  bg = new GUI.Rectangle("endBG")
  bg.width = "100%"
  bg.height = "100%"
  bg.thickness = 0
  bg.isPointerBlocker = true
  bg.background = "rgba(0,0,0,0.8)"
  ui.addControl(bg)

  // 文字
  message = new GUI.TextBlock("endMessage", "YOU WIN!")
  message.color = "white"
  message.fontSize = 78
  message.top = "-220px"
  message.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
  ui.addControl(message)

  message2 = new GUI.TextBlock("endMessage", "YOU WIN!")
  message2.color = "rgba(215, 215, 215, 1)"
  message2.fontSize = 42
  message2.top = "-80px"
  message2.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
  ui.addControl(message2)

  // 按钮
  restartBtn = GUI.Button.CreateSimpleButton("restartBtn", "Restart")
  restartBtn.width = "280px"
  restartBtn.height = "110px"
  restartBtn.cornerRadius = 10
  restartBtn.color = "white"
  restartBtn.fontSize = 46
  restartBtn.background = "#333"
  restartBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER
  restartBtn.top = "60px"
  ui.addControl(restartBtn)

  const basePath = window.location.origin + (window.location.pathname.includes('webarfps') ? '/webarfps/' : '/'); 
  img1 = new GUI.Image("cornerImg", `${basePath}win.png`)
  img1.width = "180px"
  img1.height = "180px"
  img1.top = "280px"
  ui.addControl(img1)
  img1.isVisible = false
    
  img2 = new GUI.Image("cornerImg", `${basePath}textures/lose.png`)
  img2.width = "180px"
  img2.height = "180px"
  img2.top = "280px"
  ui.addControl(img2)
  img1.isVisible = false

  restartBtn.onPointerUpObservable.add(() => {
    hideEndGameUI()
    onRestart()
  })

  ui.rootContainer.isVisible = false
}

export function showEndGameUI(type: "win" | "lose") {
  if (!ui || !message || !bg || !message2 || !img1 || !img2) return

  if (type === "win") {
    message.text = "YOU WIN!"
    message2.text="Your territory is pest-free… for now.\nBut that faint rustling you hear? Round two is calling!"
    bg.background = "rgba(0, 150, 0, 1)" // 绿色胜利背景
    img1.isVisible = true
    img2.isVisible = false
  } else {
    message.text = "GAME OVER"
    message2.text="You fled the bug nest in utter disgrace.\nBut you swear—you’ll return armed with bug spray."
    bg.background = "rgba(150, 0, 0, 1)" // 红色失败背景
    img1.isVisible = false
    img2.isVisible = true
  }

  ui.rootContainer.isVisible = true
}

export function hideEndGameUI() {
  if (!ui) return
  ui.rootContainer.isVisible = false
}
