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
