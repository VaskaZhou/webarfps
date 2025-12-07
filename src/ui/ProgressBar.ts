import * as GUI from "babylonjs-gui"
import * as BABYLON from "babylonjs"

import { gameState } from "../GameState"

export function createProgressBarUI(scene: BABYLON.Scene) {
  const ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("progressUI", true, scene)

  const maxScore = gameState.thresholds[gameState.thresholds.length - 1]

  // 背景条
  const bg = new GUI.Rectangle("scoreBG")
  bg.width = "80%"
  bg.height = "80px"
  bg.color = "white"
  bg.thickness = 2
  bg.background = "rgba(0,0,0,0.4)"
  bg.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
  bg.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
  bg.top = "-40px"
  ui.addControl(bg)

  // 前景进度条
  const bar = new GUI.Rectangle("scoreBar")
  bar.width = "0%"         // 动态更新
  bar.height = "100%"
  bar.background = "#4CAF50"
  bar.thickness = 0
  bar.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT  // ← 新增：左对齐
  bg.addControl(bar)

// 阶段标记
const marks = []
for (let i = 1; i < gameState.thresholds.length; i++) {
  const x = gameState.thresholds[i]
  const percent = x / maxScore   // 0~1

  const label = new GUI.TextBlock()
  label.color = "white"
  label.fontSize = 26

  if (i < gameState.thresholds.length - 1) {
    label.text = `LV.${i}`
    label.left = `${percent * 100 - 50}%`
  } else {
    label.text = "🏆"
    label.left = `${percent * 100 - 50 - 3}%` // 微调位置
  }

  label.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
  label.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER

  bg.addControl(label)
  marks.push(label)
}

  // 每帧更新进度条
  scene.onBeforeRenderObservable.add(() => {
    const p = gameState.score / maxScore
    bar.width = `${Math.min(1, p) * 100}%`
  })
}

// =======================
// Upgrade popup message
// =======================
export function showUpgradePopup(scene: BABYLON.Scene, phase: number) {
  const ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("upgradeUI", true, scene)

  const msg = new GUI.TextBlock()
  msg.text = getMessageForPhase(phase)
  msg.color = "white"
  msg.fontSize = 36
  msg.outlineWidth = 4
  msg.outlineColor = "black"

  msg.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
  msg.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER

  ui.addControl(msg)

  // ---- 动画效果：上升 + 放大 + 淡出 ----
  const animTime = 180
  let frame = 0

  scene.onBeforeRenderObservable.add(function animate() {
    frame++

    // 向上漂浮
    msg.top = -frame * 1.2

    // 放大
    msg.scaleX = msg.scaleY = 1 + frame * 0.01

    // 渐隐
    msg.alpha = 1 - frame / animTime

    if (frame >= animTime) {
      ui.dispose()
      scene.onBeforeRenderObservable.removeCallback(animate)
    }
  })
}


// Choose message based on phase
function getMessageForPhase(phase: number): string {
  switch (phase) {
    case 2: return "Piercing unlocked! \nCrush those bugs like paper."
    case 3: return "Blast radius increased! \nWipe them all out!"
    case 4: return "Lifesteal activated! \nBring down the swarm!"
    default: return "Upgrade!"
  }
}
