// src/GameState.ts
import { showEndGameUI } from "./ui/EndGameUI"

export class GameState {
  score = 0
  phase = 1
  paused = false

  // thresholds[phase] = 进入下一阶段所需分数
  // 最后一个 100 是胜利条件
  thresholds = [0, 15, 40, 70, 110]
  maxPhase = 4  // Phase 4 是最后一关（4 → 100 分为胜利）
  // ---- 新增：简单的 score 事件订阅器 ----
  private _scoreListeners: ((amount: number, newScore: number) => void)[] = []

  subscribeScore(listener: (amount: number, newScore: number) => void) {
    this._scoreListeners.push(listener)
    // 返回一个取消订阅的函数，方便 caller 清理
    return () => this.unsubscribeScore(listener)
  }

  unsubscribeScore(listener: (amount: number, newScore: number) => void) {
    const idx = this._scoreListeners.indexOf(listener)
    if (idx >= 0) this._scoreListeners.splice(idx, 1)
  }

  addScore(amount: number) {
    this.score += amount
    // 通知所有监听器
    this._scoreListeners.forEach(l => l(amount, this.score))
  }

  canAdvancePhase(nextModelReady: boolean): boolean {
    // ① 先检查胜利（最后一个值）
    const victoryScore = this.thresholds[this.thresholds.length - 1]
    if (this.score >= victoryScore) {
      // 这里触发胜利逻辑（你之后要写的）
      this.paused = true
      showEndGameUI("win")
      return false // 不进入下一阶段
    }

    // ② 普通阶段推进逻辑
    if (this.phase >= this.maxPhase) return false
    const target = this.thresholds[this.phase]
    return this.score >= target && nextModelReady
  }


  checkVictory(): boolean {
    const victoryScore = this.thresholds[this.thresholds.length - 1]
    return this.score >= victoryScore
  }

  advancePhase() {
    if (this.phase < this.maxPhase) this.phase++
  }

  pause() {
    this.paused = true
    console.log("[Game] Paused — waiting for new weapon model.")
  }

  resume() {
    this.paused = false
    console.log("[Game] Resumed.")
  }
}

export const gameState = new GameState()
