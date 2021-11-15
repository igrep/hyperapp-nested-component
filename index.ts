import { h, text, app, Action, ElementVNode } from 'hyperapp';

export type LiftAction<C, P> = (childAction: C) => Action<P>

// Utility function that isn't used in this app, but would be helpful!
export const forKey = <P, K extends keyof P>(childAction: (model: P[K]) => P[K]) => (model: P, key: K): P => {
  return {
    ... model,
    [key]: childAction(model[key]),
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

  export function view<P>(color: string, model: Model, liftAction: LiftAction<(model: Model) => Model, P>): ElementVNode<P> {
    return h("div",
      { style: { "display": "inline-block", "margin-right": "1rem" } as any },
      [
        h("button", { onclick: liftAction(Increment) }, text("+")),
        h("div", { style: { color } }, text(`${model.num}`)),
        h("button", { onclick: liftAction(Decrement) }, text("-")),
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

namespace Pair {
  export type Model = {
    greenCounter: Counter.Model,
    redCounter: Counter.Model,
    totalClickCount: number,
  };

  export function init(): Model {
    return { greenCounter: Counter.init(), redCounter: Counter.init(), totalClickCount: 0 };
  }

  export function view<P>(model: Model, liftAction: LiftAction<(model: Model) => Model, P>): ElementVNode<P> {
    return h("div",
      { style: { "background-color": "lightgray", "margin-bottom": "1rem" } as any },
      [
        h("div", {}, text(`Total click count ${model.totalClickCount}`)),
        Counter.view("green", model.greenCounter, (ca) => liftAction((PairGreen(ca)))),
        Counter.view("red", model.redCounter, (ca) => liftAction((PairRed(ca)))),
      ]
    );
  }

  export const PairGreen = (childAction: (model: Counter.Model) => Counter.Model) => (model: Model) => {
    return {
      ... model,
      greenCounter: childAction(model.greenCounter),
      totalClickCount: model.totalClickCount + 1,
    };
  };

  export const PairRed = (childAction: (model: Counter.Model) => Counter.Model) => (model: Model) => {
    return {
      ... model,
      redCounter: childAction(model.redCounter),
      totalClickCount: model.totalClickCount + 1,
    };
  };

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

namespace Totals {
  export type Model = { redNum: number };

  export function init(): Model {
    return { redNum: 0 }
  }

  export function view<P>(model: Model): ElementVNode<P> {
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

const Pair1 = (childAction: (model: Pair.Model) => Pair.Model) => (model: Model) => {
  const pair1 = childAction(model.pair1);
  return {
    pair1,
    totals: Totals.UpdateRed(model.totals, Pair.getRedNum(pair1)),
    pair2: Pair.UpdateRed(model.pair2, Pair.getRedNum(pair1)),
  }
};

const Pair2 = (childAction: (model: Pair.Model) => Pair.Model) => (model: Model) => {
  const pair2 = childAction(model.pair2);
  return {
    pair2,
    totals: Totals.UpdateRed(model.totals, Pair.getRedNum(pair2)),
    pair1: Pair.UpdateRed(model.pair1, Pair.getRedNum(pair2)),
  }
};

function view(model: Model): ElementVNode<Model> {
  return h("div", {}, [
    // Totals doesn't itself dispatch any Action. So no action passed here.
    Totals.view(model.totals),

    Pair.view(model.pair1, Pair1),
    Pair.view(model.pair2, Pair2),
  ]);
}

app({
  init: init(),
  view,
  node: document.getElementById("app")!
});
