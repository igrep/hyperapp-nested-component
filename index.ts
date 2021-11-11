import { h, text, app, ElementVNode } from 'hyperapp';

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
        Counter.view("green", model.greenCounter),
        Counter.view("red", model.redCounter),
      ]
    );
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
}

namespace Totals {
  export type Model = { redNum: number };

  export function init(): Model {
    return { redNum: 0 }
  }

  export function view(model: Model): ElementVNode<Model> {
    return h("div", { style: { color: "red" } }, text(`Red val: ${model.redNum}`));
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

function view(model: Model): ElementVNode<Model> {
  return h("div", {}, [
    // Here we need a function corresponding to Html.map in Elm!
    Totals.view(model.totals),
    Pair.view(model.pair1),
    Pair.view(model.pair2),
  ]);
}

app({
  init: init(),
  view,
  node: document.getElementById("app")!
});
