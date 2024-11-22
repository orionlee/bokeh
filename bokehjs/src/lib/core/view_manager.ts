import type {HasProps} from "./has_props"
import type {View, ViewOf, IterViews} from "./view"
import type {Options} from "core/build_views"
import {build_view} from "./build_views"

abstract class AbstractViewQuery {

  abstract [Symbol.iterator](): IterViews

  *collect(fn?: (view: View) => boolean): IterViews {
    const visited = new Set<View>()

    function* descend(view: View): IterViews {
      if (visited.has(view)) {
        return
      }

      visited.add(view)

      if (fn == null || fn(view)) {
        yield view
      }

      for (const child of view.children()) {
        yield* descend(child)
      }
    }

    for (const view of this) {
      yield* descend(view)
    }
  }

  abstract query(fn: (view: View) => boolean): IterViews

  *all_views(): IterViews {
    yield* this.query(() => true)
  }

  query_one(fn: (view: View) => boolean): View | null {
    for (const view of this.query(fn)) {
      return view
    }
    return null
  }

  *find<T extends HasProps>(model: T): IterViews<ViewOf<T>> {
    yield* this.query((view) => view.model == model)
  }

  *find_by_id(id: string): IterViews {
    yield* this.query((view) => view.model.id == id)
  }

  find_one<T extends HasProps>(model: T): ViewOf<T> | null {
    for (const view of this.find(model)) {
      return view
    }
    return null
  }

  find_one_by_id(id: string): View | null {
    for (const view of this.find_by_id(id)) {
      return view
    }
    return null
  }

  get_one<T extends HasProps>(model: T): ViewOf<T> {
    const view = this.find_one(model)
    if (view != null) {
      return view
    } else {
      throw new Error(`cannot find a view for ${model}`)
    }
  }

  get_one_by_id(id: string): View {
    const view = this.find_one_by_id(id)
    if (view != null) {
      return view
    } else {
      throw new Error(`cannot find a view for a model with '${id}' identity`)
    }
  }

  find_all<T extends HasProps>(model: T): ViewOf<T>[] {
    return [...this.find(model)]
  }

  find_all_by_id(id: string): View[] {
    return [...this.find_by_id(id)]
  }

  select<T extends HasProps>(models: T[]): ViewOf<T>[] {
    return models.map((model) => this.find_one(model)).filter((view) => view != null)
  }
}

export class ViewQuery extends AbstractViewQuery {
  constructor(public view: View) {
    super()
  }

  *[Symbol.iterator](): IterViews {
    yield this.view
  }

  *query(fn: (view: View) => boolean): IterViews {
    yield* this.collect(fn)
  }

  override toString(): string {
    return `ViewQuery(${this.view})`
  }
}

export class ViewManager extends AbstractViewQuery {
  protected readonly _roots: Set<View>
  protected readonly _views: Set<View>

  constructor(roots: Iterable<View> = [], protected parent?: ViewManager) {
    super()
    this._roots = new Set(roots)
    this._views = new Set(this.collect())
  }

  override toString(): string {
    const views = [...this._roots].map((view) => `${view}`).join(", ")
    return `ViewManager(${views})`
  }

  async build_view<T extends HasProps>(model: T, parent: Options<ViewOf<T>>["parent"] = null): Promise<ViewOf<T>> {
    return await build_view(model, {owner: this, parent})
  }

  *query(fn: (view: View) => boolean): IterViews {
    for (const view of this._views) {
      if (fn(view)) {
        yield view
      }
    }
  }

  get<T extends HasProps>(model: T): ViewOf<T> | null {
    for (const view of this._roots) {
      if (view.model == model) {
        return view
      }
    }
    return null
  }

  get_by_id(id: string): ViewOf<HasProps> | null {
    for (const view of this._roots) {
      if (view.model.id == id) {
        return view
      }
    }
    return null
  }

  add(view: View): void {
    if (view.parent != null) {
      this._roots.add(view)
      this.parent?.add(view)
    }
    this._views.add(view)
  }

  delete(view: View): void {
    this._views.delete(view)
    this._roots.delete(view)
    this.parent?.delete(view)
  }

  remove(view: View): void {
    this.delete(view)
  }

  clear(): void {
    for (const view of this) {
      view.remove()
    }
  }

  /* TODO (TS 5.2)
  [Symbol.dispose](): void {
    this.clear()
  }
  */

  get roots(): View[] {
    return [...this._roots]
  }

  *[Symbol.iterator](): IterViews {
    yield* this._roots
  }
}
