import { Scene, Vector3, SceneLoader } from "babylonjs"
import "babylonjs-loaders"
import { Monster } from "../Monster"
import type { MonsterType } from "../Monster"
import type { Color3, ISceneLoaderProgressEvent } from "babylonjs"
import { Player } from "../Player"



export class MonsterManager {
  scene: Scene
  monsters: Monster[] = []
  monsterModels: { file: string; type: MonsterType; color: Color3 }[] = [
    { file: "bee.glb", type: "flying", color: new BABYLON.Color3(255, 255, 0) }, // 朝相机移动（Y 会变）
    { file: "caterpie.glb", type: "ground", color: new BABYLON.Color3(0, 255, 0) }  // 只在 XZ 平面移动
  ]

  constructor(scene: Scene) {
    this.scene = scene
  }

  async spawnMonster(pos: Vector3) {
    const aliveCount = this.monsters.filter(m => m.alive).length
    if (aliveCount >= 30) {
      return null
    }
    const model = this.monsterModels[Math.floor(Math.random() * this.monsterModels.length)]

    const basePath = window.location.origin + (window.location.pathname.includes('webarfps') ? '/webarfps/' : '/');      

    // 使用 LoadAssetContainerAsync + Options
    const container = await SceneLoader.LoadAssetContainerAsync(
      `${basePath}models/`,
      model.file,
      this.scene,
      (evt: ISceneLoaderProgressEvent) => {
        if (evt.lengthComputable) {
          //console.log(`加载 ${model}: ${(evt.loaded / evt.total * 100).toFixed(1)}%`)
        }
      },
      ".glb",
      { meshNames: "", cloneAnimations: true } as any   // ✅ 断言 any
    )

    container.addAllToScene()

    // 通常第一个 mesh 是 root
    const mesh = container.meshes[0]

    // 应用偏移，保持原始Y值
    const spawnPos = new Vector3(
      pos.x + (Math.random()*2 -1)*0.3,
      pos.y,
      pos.z + (Math.random()*2 -1)*0.3,
    )
    mesh.position.copyFrom(spawnPos)
    if (model.file === "bee.glb") {
      mesh.scaling = new Vector3(0.01, 0.01, 0.01)
    } else if (model.file === "caterpie.glb") {
      mesh.scaling = new Vector3(0.3, 0.3, 0.3)
    }
    // 创建 Monster
    const monster = new Monster(mesh, container.animationGroups, model.type, 0.006, model.color)
    this.monsters.push(monster)

    // ✅ 调试输出动画组名字
    if (container.animationGroups.length > 0) {
      //console.log(`怪物 ${model} 的动画组:`)
      //container.animationGroups.forEach(a => console.log(" -", a.name))
    } else {
      //console.warn(`怪物 ${model} 没有动画组`)
    }

    // 默认播放跑步
    //monster.playIdle()
    return monster
  }

  update(cameraPos: Vector3, player: Player) {
  this.monsters.forEach(m => m.update(cameraPos, player))
  }

  clearAll() {
    for (const m of this.monsters) {
      m.mesh.dispose()
      m.alive = false
    }
    this.monsters = []
  }

}
