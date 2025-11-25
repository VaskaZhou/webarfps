import {
  Engine, Scene, Vector3, HemisphericLight,
  WebXRDefaultExperience, WebXRHitTest
} from "babylonjs"
import * as GUI from "babylonjs-gui"
import "babylonjs-loaders"
import { MonsterManager } from "./managers/MonsterManager"
import { DebugUI } from "./ui/DebugUI"
import { Player } from "./Player"
import { BulletManager } from "./managers/BulletManager"
import { WeaponManager } from "./managers/WeaponManager"
import { ModelCapture } from "./ModelCapture"
import { gameState } from "./GameState"
import { initPauseOverlay } from "./ui/PauseOverlay"
import { createProgressBarUI } from "./ui/ProgressBar"
import { initEndGameUI } from "./ui/EndGameUI"

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement
const engine = new Engine(canvas, true)
let scene: Scene
let spawntime=2048
let monsterManager: MonsterManager
let player: Player

async function createScene() {
  scene = new Scene(engine)
  new HemisphericLight("light", new Vector3(0, 1, 0), scene)

  initPauseOverlay(scene)
  createProgressBarUI(scene)
  initEndGameUI(scene, () => {
    restartGame()
  })

  // Step 1: weapon manager
  const weaponManager = new WeaponManager(scene)

  // Step 2: run model capture BEFORE AR starts
  const capture = new ModelCapture(weaponManager)
  await capture.run() // Wait until 3 captures done, camera closed

  // Step 3: now enter AR mode
  let xr: WebXRDefaultExperience
  try {
    xr = await scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "unbounded" },
      optionalFeatures: true
    })
  } catch {
    alert("WebXR not supported. Please use Android Chrome.")
    return
  }

  const fm = xr.baseExperience.featuresManager
  const hit = fm.enableFeature(
    BABYLON.WebXRFeatureName.HIT_TEST,
    "latest",
    { transientHitTest: false }
  ) as WebXRHitTest

  monsterManager = new MonsterManager(scene)
  new DebugUI(scene, monsterManager, () => xr.baseExperience.camera.globalPosition)
  player = new Player(scene)
  const bulletManager = new BulletManager(scene, monsterManager, weaponManager)

  // Spawn monsters via hit test
  let lastSpawn = 0
  hit.onHitTestResultObservable.add((results: any[]) => {
    if (gameState.paused) return
    const now = performance.now()
    if (now - lastSpawn < spawntime) return
    lastSpawn = now

    if (!results?.length) return
    const pos = (results[0] as any).position as Vector3 | undefined
    if (!pos) return
    monsterManager.spawnMonster(pos)
  })

  // Test button
  const ui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("gameUI", true, scene)
  const nextBtn = GUI.Button.CreateSimpleButton("nextWeapon", "Next Weapon (test)")
  nextBtn.width = "200px"
  nextBtn.height = "48px"
  nextBtn.color = "white"
  nextBtn.background = "#444"
  nextBtn.cornerRadius = 10
  nextBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
  nextBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
  nextBtn.top = "20px"
  nextBtn.left = "-20px"
  ui.addControl(nextBtn)

  nextBtn.onPointerClickObservable.add(() => {
    if (weaponManager.onlyDefault()) {
      console.log("[Test] No custom weapons yet. Generation still in progress.")
    } else {
      const name = weaponManager.nextWeapon()
      console.log("[Test] Switched weapon to:", name)
    }
  })

  // Shooting
  scene.onPointerObservable.add(pi => {
    if (gameState.paused) return
    if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      if (!player.tryShoot()) return
      const cam = xr.baseExperience.camera
      const pos = cam.globalPosition.clone()
      const dir = cam.getDirection(Vector3.Forward()).normalize()
      bulletManager.shoot(pos, dir)
    }
  })

  // Per-frame update
  scene.onBeforeRenderObservable.add(() => {
    if (gameState.paused) return // Pause all updates when gamestate is paused, waiting for model capture
    const camPos = xr.baseExperience.camera.globalPosition
    monsterManager.update(camPos, player)
    bulletManager.update()
  })
}

async function run() {
  await createScene()
  engine.runRenderLoop(() => scene.render())
  window.addEventListener("resize", () => engine.resize())
}
run()

function restartGame() {
  console.log("[Game] Restarting...")

  // 清空怪物
  monsterManager.clearAll()

  // 重置 GameState
  gameState.score = 0
  gameState.phase = 1
  gameState.paused = false

  // 玩家回血
  player.reset()

  // 重新开始游戏（无需重载场景）
  // 可以在这里触发游戏继续运行
}
