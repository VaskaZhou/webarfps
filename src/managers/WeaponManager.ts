// src/managers/WeaponManager.ts
import * as BABYLON from "babylonjs"
import "babylonjs-loaders"

type Weapon = {
  name: string
  createBullet: () => BABYLON.AbstractMesh  // factory for one bullet mesh
}

export class WeaponManager {
  private scene: BABYLON.Scene
  public weapons: Weapon[] = []
  private current = 0

  constructor(scene: BABYLON.Scene) {
    this.scene = scene
    this.registerDefaultBullet()
  }

  // Default weapon: simple yellow sphere
  private registerDefaultBullet() {
    const basePath = window.location.origin + (window.location.pathname.includes('webarfps') ? '/webarfps/' : '/'); 
    BABYLON.SceneLoader.LoadAssetContainerAsync(`${basePath}models/`, "slipper.glb", this.scene)
    .then(container => {
      container.addAllToScene()

      // Use the root mesh exactly like before (preserve its transforms)
      const root = container.meshes[0] as BABYLON.AbstractMesh
      root.setEnabled(false)
      root.scaling.setAll(0.02) // same scale you used before

      this.weapons.push({
        name: "Default Slipper",
        createBullet: () => {
          // clone whole hierarchy instead of createInstance / child mesh
          const inst = root.clone("bullet_slipper", null) as BABYLON.AbstractMesh
          inst.setEnabled(true)
          return inst
        }
      })
    })
    .catch(err => {
      console.error("[WeaponManager] Failed to load default slipper:", err)
    })
}


  /**
   * Register a new weapon from a GLB url.
   * This is called when your server finishes generating a model.
   */
  async registerWeaponFromGLB(url: string, opts?: { scale?: number }) {
    try {
      const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        "",
        url,
        this.scene,
        undefined,
        ".glb"
      )
      container.addAllToScene()

      // 找第一个有 geometry 的 mesh
      // const source = container.meshes.find(m =>
      //   (m as BABYLON.Mesh).getTotalVertices &&
      //   (m as BABYLON.Mesh).getTotalVertices() > 0
      // ) as BABYLON.Mesh | undefined
      const source = container.meshes[0] as BABYLON.AbstractMesh

      if (!source) {
        console.error("[WeaponManager] No valid mesh in GLB:", url)
        return
      }

      source.setEnabled(false)
      if (opts?.scale) source.scaling.setAll(opts.scale)

      this.weapons.push({
        name: `Remote GLB (${this.weapons.length})`,
        createBullet: () => {
          // 用 clone 代替 createInstance 更安全
          const inst = source.clone(`bullet_glb_${this.weapons.length}`, null)!
          inst.setEnabled(true)
          return inst
        }
      })

      console.log("[WeaponManager] Registered weapon from GLB:", url)
    } catch (e) {
      console.error("[WeaponManager] Failed to load GLB weapon:", url, e)
    }
  }


  /**
   * Switch to next weapon in the list.
   * Used by the test button.
   */
  nextWeapon(): string {
    if (this.weapons.length <= 1) {
      console.log("[WeaponManager] No custom weapons received yet.")
      return this.weapons[this.current].name
    }
    this.current = (this.current + 1) % this.weapons.length
    console.log("[WeaponManager] Switched to:", this.weapons[this.current].name)
    return this.weapons[this.current].name
  }

  /** Return true if only the default weapon is available. */
  onlyDefault(): boolean {
    return this.weapons.length <= 1
  }

  /** Create one bullet mesh for current weapon. Called by BulletManager. */
  createBulletMesh(): BABYLON.AbstractMesh {
    return this.weapons[this.current].createBullet()
  }
  setCurrentWeapon(index: number) {
  if (index < this.weapons.length) {
    this.current = index
    console.log("[WeaponManager] Switched to phase weapon:", this.weapons[index].name)
  } else {
    console.warn("[WeaponManager] Tried to switch to unavailable weapon", index)
  }
}

}
