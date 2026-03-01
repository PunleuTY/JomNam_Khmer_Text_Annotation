const KEY = "khmer-annotation-project"

export function saveProject(state) {
  try {
    const toSave = {
      images: state.images?.map(({ id, name, url, width, height }) => ({ id, name, url, width, height })) || [],
      annotations: state.annotations || {},
      currentId: state.currentId || null,
      lang: state.lang || "khm",
      ts: Date.now(),
    }
    localStorage.setItem(KEY, JSON.stringify(toSave))
  } catch (e) {
    console.warn("Failed to save project:", e)
  }
}

export function loadProject() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn("Failed to load project:", e)
    return null
  }
}

export function clearProject() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    console.log("okey")
  }
}
