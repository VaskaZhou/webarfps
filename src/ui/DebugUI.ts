import * as GUI from "babylonjs-gui"
import { Scene, Vector3 } from "babylonjs"
import { MonsterManager } from "../managers/MonsterManager"

export class DebugUI {
  text: GUI.TextBlock

  constructor(scene: Scene, monsterManager: MonsterManager, getCamPos: () => Vector3) {
    const guiTex = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene)
    this.text = new GUI.TextBlock()
    this.text.color = "white"
    this.text.fontSize = 22
    this.text.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
    this.text.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP
    this.text.paddingTop = "10px"
    this.text.paddingLeft = "10px"
    guiTex.addControl(this.text)

    scene.onBeforeRenderObservable.add(() => {
      const pos = getCamPos()
      this.text.text =
        `Camera: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})\n` +
        `Monsters: ${monsterManager.monsters.length}`
    })
  }
}
