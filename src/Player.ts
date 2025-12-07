import * as BABYLON from "babylonjs"
import * as GUI from "babylonjs-gui"
import { gameState } from "./GameState"
import { showEndGameUI } from "./ui/EndGameUI"

export class Player {
  health: number = 100
  maxHealth: number = 100
  healthBarGreen: GUI.Rectangle
  healthBarRed: GUI.Rectangle
  // ✅ 射击冷却
  canShoot: boolean = true
  cooldownTime: number = 400  // 毫秒
  cooldownProgress: number = 0 // 0~1
  cooldownBar: GUI.Rectangle

  private _unsubscribeScore?: () => void


  constructor(scene: BABYLON.Scene) {
    // 创建 UI
    const guiTex = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene)

    // 红色背景（损血部分）
    const red = new GUI.Rectangle()
    red.width = "60%"
    red.height = "25px"
    red.color = "white"
    red.thickness = 2
    red.background = "red"
    red.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    red.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    red.top = "110px"// 距离顶部 110px
    guiTex.addControl(red)

    // 绿色血条（当前血量）
    const green = new GUI.Rectangle()
    green.width = "100%"
    green.height = "100%"
    green.background = "green"
    green.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT  // ✅ 关键点：左对齐
    red.addControl(green)

    this.healthBarGreen = green
    this.healthBarRed = red
  // ----- 灰色冷却条 -----
    const cooldownBg = new GUI.Rectangle()
    cooldownBg.width = "60%"
    cooldownBg.height = "6px"
    cooldownBg.background = "gray"
    cooldownBg.color = "white"
    cooldownBg.thickness = 1
    cooldownBg.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    cooldownBg.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    cooldownBg.top = "90px"
    guiTex.addControl(cooldownBg)

    const cooldownFill = new GUI.Rectangle()
    cooldownFill.width = "100%"
    cooldownFill.height = "100%"
    cooldownFill.background = "white"
    cooldownFill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    cooldownBg.addControl(cooldownFill)

    this.healthBarGreen = green
    this.healthBarRed = red
    this.cooldownBar = cooldownFill

    this._unsubscribeScore = gameState.subscribeScore((amount, newScore) => {
      // Phase 4 lifesteal
      console.log(`Player get score: ${amount}. Now score is: ${newScore}`)
      if (this.health < this.maxHealth && gameState.phase==4)this.health += 1
    })
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount)
    this.updateHealthBar()
    if (this.health <= 0) {
      gameState.pause()
      showEndGameUI("lose")
    }
  }

  updateHealthBar() {
    const ratio = this.health / this.maxHealth
    this.healthBarGreen.width = `${(ratio * 100).toFixed(1)}%`
  }

  // ✅ 射击冷却逻辑（灰→白逐渐恢复）
  tryShoot(): boolean {
    if (!this.canShoot) return false

    this.canShoot = false
    this.cooldownProgress = 0
    this.updateCooldownBar()

    setTimeout(() => {
      this.canShoot = true
      this.cooldownProgress = 1
      this.updateCooldownBar()
    }, this.cooldownTime)

    // 让白条慢慢“填满”
    const step = 16
    const interval = setInterval(() => {
      this.cooldownProgress += step / this.cooldownTime
      if (this.cooldownProgress >= 1) {
        this.cooldownProgress = 1
        this.updateCooldownBar()
        clearInterval(interval)
      } else {
        this.updateCooldownBar()
      }
    }, step)

    return true
  }

  updateCooldownBar() {
    this.cooldownBar.width = `${(this.cooldownProgress * 100).toFixed(1)}%`
  }
  
  public reset() {
    // 重置玩家状态
    this.health = this.maxHealth
    this.updateHealthBar()
  }

  dispose() {
    // 清理监听器
    this._unsubscribeScore && this._unsubscribeScore()
  }
}
