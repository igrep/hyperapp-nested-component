import { h, text, app, Action, ElementVNode, Dispatchable, MaybeEffect, Effect, Dispatch, MaybeVNode, VNode } from 'hyperapp';

const TEXT_NODE = 3;

type Indexable = string | unknown[] | Record<string, any>

function mapElementVNode<S1, S2>(
  vnode: ElementVNode<S1>,
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): ElementVNode<S2> {
  const { props, children, events, tag } = vnode;

  let props_: any  = {};
  for (const k in props) {
    if (k[0] == "o" && k[1] == "n") {
      props_[k] = mapAction(props[k] as ActionOrActionWithPayload<S1>, f12, f21);
    } else {
      props_[k] = props[k];
    }
  }

  let events_: Record<string, ActionOrActionWithPayload<S2>> = {};
  if (events) {
    for (const k in events){
      events_[k] = mapAction(events[k], f12, f21);
    }
  }

  let tag_ : string | ((data: Indexable) => VNode<S2>);
  if (typeof tag === 'string') {
    tag_ = tag;
  } else {
    tag_ = (data) => mapVNode(tag(data), f12, f21);
  }

  return {
    ... vnode,
    props: props_,
    children: children.map((child) => mapMaybeVNode(child, f12, f21)),
    events: events_,
    tag: tag_,
  };
}

type ActionOrActionWithPayload<S> = Action<S> | readonly [action: Action<S>, payload: unknown];

function mapAction<S1, S2>(
  action: ActionOrActionWithPayload<S1>,
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): ActionOrActionWithPayload<S2> {
  if (action instanceof Array) {
    return [
      (state: S2, payload: unknown) => {
        return mapDispatchable<S1, S2>(action[0](f21(state), payload), f12, f21);
      },
      action[1],
    ]
  }
  return (state: S2, payload: unknown) => {
    return mapDispatchable<S1, S2>(action(f21(state), payload), f12, f21);
  };
}

function mapDispatchable<S1, S2>(
  dispatchable: Dispatchable<S1>,
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): Dispatchable<S2> {
  if (dispatchable instanceof Array) {
    if (typeof dispatchable[0] === 'function') {
      return mapAction(dispatchable as ActionOrActionWithPayload<S1>, f12, f21);
    }
    return [
      f12(dispatchable[0]),
      ... mapMaybeEffects(dispatchable.slice(1), f12, f21),
    ];
  }
  if (typeof dispatchable === 'function') {
    return mapAction(dispatchable as Action<S1>, f12, f21);
  }
  return f12(dispatchable);
}

function mapMaybeEffects<S1, S2>(
  maybeEffects: MaybeEffect<S1, unknown>[],
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): MaybeEffect<S2, unknown>[] {
  return maybeEffects.map(maybeEffect => {
    if (maybeEffect && maybeEffect !== true){
      return mapEffect(maybeEffect, f12, f21);
    }
    return maybeEffect as MaybeEffect<S2, unknown>;
  })
}

function mapEffect<S1, S2>(
  effect: Effect<S1>,
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): Effect<S2, unknown> {
  return [
    (dispatch, payload) => {
      return effect[0](mapDispatch(dispatch, f21, f12), payload);
    },
    effect[1],
  ];
}

function mapDispatch<S1, S2>(
  dispatch: Dispatch<S1>,
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): Dispatch<S2> {
  return (dispatchable, payload) => {
    return dispatch(mapDispatchable(dispatchable, f21, f12), payload)
  }
}

function mapMaybeVNode<S1, S2>(
  vnode: MaybeVNode<S1>,
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): MaybeVNode<S2> {
  if (vnode && vnode !== true && vnode.type !== TEXT_NODE){
    return mapElementVNode(vnode, f12, f21);
  }
  return vnode as MaybeVNode<S2>
}

function mapVNode<S1, S2>(
  vnode: VNode<S1>,
  f12: (state1: S1) => S2,
  f21: (state2: S2) => S1,
): VNode<S2> {
  if (vnode.type !== TEXT_NODE){
    return mapElementVNode(vnode, f12, f21);
  }
  return vnode as VNode<S2>
}

namespace Pair {
  export type Model = {
    greenCounter: Counter.Model,
    redCounter: Counter.Model,
    totalClickCount: number,
  };

  export function init(): Model {
    return { greenCounter: Counter.init(), redCounter: Counter.init(), totalClickCount: 0 };
  }

  export function view(model: Model): ElementVNode<Model> {
    return h("div",
      { style: { "background-color": "lightgray", "margin-bottom": "1rem" } as any },
      [
        h("div", {}, text(`Total click count ${model.totalClickCount}`)),
        mapElementVNode(
          Counter.view("green", model.greenCounter),
          (greenCounter) => { return { ... model, greenCounter, totalClickCount: model.totalClickCount + 1 } },
          (m) => { return m.greenCounter },
        ),
        mapElementVNode(
          Counter.view("red", model.redCounter),
          (redCounter) => { return { ... model, redCounter, totalClickCount: model.totalClickCount + 1 } },
          (m) => { return m.redCounter },
        ),
      ]
    );
  }

  export function UpdateRed(model: Model, value: number): Model {
    return {
      ... model,
      redCounter: Counter.SetNum(model.redCounter, value),
    }
  }

  export function getRedNum(model: Model): number {
    return Counter.getNum(model.redCounter);
  }
}

namespace Counter {
  export type Model = {
    num: number;
    btnClicks: number;
  };

  export function init(): Model {
    return { num: 0, btnClicks: 0 };
  }

  export function view(color: string, model: Model): ElementVNode<Model> {
    return h("div",
      { style: { "display": "inline-block", "margin-right": "1rem" } as any },
      [
        h("button", { onclick: Increment }, text("+")),
        h("div", { style: { color } }, text(`${model.num}`)),
        h("button", { onclick: Decrement }, text("-")),
        h("div", {}, text(`btn click: ${model.btnClicks}`)),
      ]
    );
  }

  export function Increment(model: Model): Model {
    return { num: model.num + 1, btnClicks: model.btnClicks + 1 };
  }

  export function Decrement(model: Model): Model {
    return { num: model.num - 1, btnClicks: model.btnClicks + 1 };
  }

  export function SetNum(model: Model, num: number): Model {
    return { ... model, num };
  }

  export function getNum(model: Model): number {
    return model.num
  }
}

namespace Totals {
  export type Model = { redNum: number };

  export function init(): Model {
    return { redNum: 0 }
  }

  export function view(model: Model): ElementVNode<Model> {
    return h("div", { style: { color: "red" } }, text(`Red val: ${model.redNum}`));
  }

  export function UpdateRed(model: Model, redNum: number): Model {
    return { ... model, redNum };
  }
}

type Model = {
  pair1: Pair.Model,
  pair2: Pair.Model,
  totals: Totals.Model,
};

function init(): Model {
  return { pair1: Pair.init(), pair2: Pair.init(), totals: Totals.init() };
}

function UpdateWithPair1(model: Model, newPair1: Pair.Model): Model {
  const totals = Totals.UpdateRed(model.totals, Pair.getRedNum(newPair1));
  const pair2 = Pair.UpdateRed(model.pair2, Pair.getRedNum(newPair1));
  return {
    pair1: newPair1,
    pair2,
    totals,
  }
}

function UpdateWithPair2(model: Model, newPair2: Pair.Model): Model {
  const totals = Totals.UpdateRed(model.totals, Pair.getRedNum(newPair2));
  const pair1 = Pair.UpdateRed(model.pair1, Pair.getRedNum(newPair2));
  return {
    pair1,
    pair2: newPair2,
    totals,
  }
}

function view(model: Model): ElementVNode<Model> {
  return h("div", {}, [
    // Totals doesn't itself dispatch any Action. So ignore.
    mapElementVNode<Totals.Model, Model>(Totals.view(model.totals), (_totals) => { return model }, (m) => { return m.totals }),

    mapElementVNode<Pair.Model, Model>(
      Pair.view(model.pair1),
      (pair1) => UpdateWithPair1(model, pair1),
      (m) => { return m.pair1 }
    ),
    mapElementVNode<Pair.Model, Model>(
      Pair.view(model.pair2),
      (pair2) => UpdateWithPair2(model, pair2),
      (m) => { return m.pair2 }
    ),
  ]);
}

app({
  init: init(),
  view,
  node: document.getElementById("app")!
});
