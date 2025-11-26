import { AbstractMesh, Vector3, AnimationGroup } from "babylonjs"
export type MonsterType = "flying" | "ground"
import { Player } from "./Player"

export class Monster {
  mesh: AbstractMesh
  animations: AnimationGroup[]
  speed: number
  alive: boolean = true
  type: MonsterType
  lastAttackTime: number = 0
  color: BABYLON.Color3

  constructor(mesh: AbstractMesh, animations: AnimationGroup[],type: MonsterType, speed: number = 0.01, color?: BABYLON.Color3) {
    this.mesh = mesh
    this.animations = animations
    this.speed = speed
    this.type = type
    this.color = color ?? new BABYLON.Color3(1, 1, 1) // 默认白色
  }

  update(cameraPos: Vector3, player: Player) {
    if (!this.alive) return

    let target = cameraPos.clone()
    if (this.type === "ground") target.y = this.mesh.position.y

    this.mesh.lookAt(target)
    if (this.type === "ground") this.mesh.rotate(Vector3.Up(), Math.PI)

    const distance = target.subtract(this.mesh.position).length()

    if (distance < 0.6) {
      // 攻击冷却 1 秒
      const now = performance.now()
      if (now - this.lastAttackTime > 1000) {
        this.attack(player)
        this.lastAttackTime = now
      }
      return
    }

    const dir = target.subtract(this.mesh.position).normalize()
    this.mesh.position.addInPlace(dir.scale(this.speed))
  }

  attack(player: Player) {
    player.takeDamage(1)

    // 🔥 Attack hit particle effect (small red flash)
    const ps = new BABYLON.ParticleSystem("attackParticles", 60, this.mesh.getScene() as unknown as BABYLON.Scene)
    const basePath = window.location.origin + (window.location.pathname.includes('webarfps') ? '/webarfps/' : '/'); 
    ps.particleTexture = new BABYLON.Texture(`${basePath}textures/flare.png`, this.mesh.getScene() as unknown as BABYLON.Scene)
    ps.emitter = this.mesh.position.clone() as unknown as BABYLON.Vector3
    // ps.minEmitBox = new BABYLON.Vector3(-0.05, -0.05, -0.05)
    // ps.maxEmitBox = new BABYLON.Vector3(0.05, 0.05, 0.05)
    const cone = new BABYLON.ConeParticleEmitter(
        0.1,            // 半径
        Math.PI / 2     // 锥角，越大越像烟花爆炸
      )
    cone.directionRandomizer = 0.8      // 更随机的角度
    ps.particleEmitterType = cone
    // 红色粒子
    ps.color1 = new BABYLON.Color4(1, 0, 0, 0.8)
    ps.color2 = new BABYLON.Color4(1, 0, 0, 0.7)
    ps.colorDead = new BABYLON.Color4(1, 0, 0, 0)

    // 更小、更快
    ps.minSize = 0.005
    ps.maxSize = 0.015
    ps.minLifeTime = 0.05
    ps.maxLifeTime = 0.15
    ps.emitRate = 120
    ps.minEmitPower = 0.05
    ps.maxEmitPower = 0.2
    ps.gravity = new BABYLON.Vector3(0, -3, 0)
    ps.direction1 = new BABYLON.Vector3(-1, 1, -1)
    ps.direction2 = new BABYLON.Vector3(1, 1, 1)
    ps.disposeOnStop = true

    ps.start()
    setTimeout(() => ps.stop(), 200)
  }




  playIdle() {
    this.stopAll()
    const runAnim = this.animations.find(a => a.name.toLowerCase().includes("idle"))
    runAnim?.start(true)
  }

  playAttack() {
    this.stopAll()
    const attackAnim = this.animations.find(a => a.name.toLowerCase().includes("attack"))
    attackAnim?.start(false)
  }

  playDie() {
    this.stopAll()
    const dieAnim = this.animations.find(a => a.name.toLowerCase().includes("die"))
    dieAnim?.start(false)
    this.alive = false
  }

  stopAll() {
    this.animations.forEach(a => a.stop())
  }
}
