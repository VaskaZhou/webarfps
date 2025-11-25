import * as BABYLON from "babylonjs"
import "babylonjs-loaders"
import { MonsterManager } from "./MonsterManager"
import { WeaponManager } from "./WeaponManager"
import { gameState } from "../GameState"
import { showPauseOverlay  } from "../ui/PauseOverlay"


export class BulletManager {
  scene: BABYLON.Scene
  bullets: BABYLON.AbstractMesh[] = []
  monsterManager: MonsterManager
  weaponManager: WeaponManager

  constructor(scene: BABYLON.Scene, monsterManager: MonsterManager, weaponManager: WeaponManager) {
    this.scene = scene
    this.monsterManager = monsterManager
    this.weaponManager = weaponManager
  }

  async shoot(from: BABYLON.Vector3, direction: BABYLON.Vector3) {
    const dir = direction.normalize()
    const bullet = this.weaponManager.createBulletMesh()
    bullet.position.copyFrom(from)
    bullet.metadata = {
      bornTime: performance.now(),
      direction: dir.clone()
    }
    this.bullets.push(bullet)
  }

  // ✅ 每帧更新
  update() {
    const now = performance.now()
    this.bullets = this.bullets.filter(bullet => {
      // ✅ 复制方向再缩放，防止速度衰减
      const dir = bullet.metadata.direction.clone()
      bullet.position.addInPlace(dir.scale(0.08)) // 0.08 是速度
      //bullet.lookAt(bullet.position.add(dir))
      //bullet.rotate(BABYLON.Vector3.Left(), Math.PI/2)
      const deltaTime = this.scene.getEngine().getDeltaTime() // 当前帧耗时 (ms)
      bullet.rotate(BABYLON.Vector3.Up(), 10*deltaTime/1000)// 旋转子弹

      // ---- 检查与怪物的距离（简单碰撞） ----
      for (const monster of this.monsterManager.monsters) {
        if (!monster.alive) continue
        const dist = BABYLON.Vector3.Distance(bullet.position, monster.mesh.position)
        if (dist < 0.1) { // 0.1 距离内算命中
          // Spawn color particle effect
          spawnDeathParticles(this.scene, monster.mesh.position, monster.color)
          monster.mesh.dispose()
          monster.alive = false
          bullet.dispose()

          //  加分
          gameState.addScore(1)

          //  阶段推进逻辑
          const nextWeaponIndex = gameState.phase // 下一个阶段需要的 weapon index
          const nextWeaponReady = this.weaponManager.weapons.length > nextWeaponIndex
          
          //let nextWeaponReady = this.weaponManager.weapons.length > nextWeaponIndex
          //nextWeaponReady=true // 测试用，跳过暂停
          if (gameState.canAdvancePhase(nextWeaponReady)) {
            gameState.advancePhase()
            console.log(`[Game] Phase ${gameState.phase} reached!`)
            this.weaponManager.setCurrentWeapon(nextWeaponIndex)//comment if test
          } else if (gameState.phase < gameState.maxPhase && gameState.score >= gameState.thresholds[gameState.phase] && !nextWeaponReady) {
            gameState.pause()
            showPauseOverlay()
          }

          return false // bullet 被移除
        }
      }

      // ---- 子弹生命周期（飞 3 秒自动销毁） ----
      if (now - bullet.metadata.bornTime > 2400) {
        bullet.dispose()
        return false
      }

      return true // ✅ 保留在数组里
    })
  }

}
function spawnDeathParticles(scene: BABYLON.Scene, position: BABYLON.Vector3, color: BABYLON.Color3) {
  const ps = new BABYLON.ParticleSystem("deathParticles", 100, scene)
  ps.particleTexture = new BABYLON.Texture("/textures/flare.png", scene) // 小光点贴图，可自换
  ps.emitter = position.clone()
  ps.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1)
  ps.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1)

  // 粒子颜色
  ps.color1 = new BABYLON.Color4(color.r, color.g, color.b, 0.6)
  ps.color2 = new BABYLON.Color4(color.r, color.g, color.b, 0.1)
  ps.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0)

  // 速度、大小、寿命
  ps.minSize = 0.01
  ps.maxSize = 0.02
  ps.minLifeTime = 0.2
  ps.maxLifeTime = 0.4
  ps.emitRate = 100
  ps.minEmitPower = 0.1
  ps.maxEmitPower = 0.3
  ps.gravity = new BABYLON.Vector3(0, -2, 0)
  ps.direction1 = new BABYLON.Vector3(-1, 1, -1)
  ps.direction2 = new BABYLON.Vector3(1, 1, 1)
  ps.disposeOnStop = true

  // 自动停止（粒子播完自动销毁）
  ps.start()
  setTimeout(() => ps.stop(), 400)
}

