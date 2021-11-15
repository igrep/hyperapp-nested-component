# hyperapp-nested-component

Port [Example of Sibling/Nested component communication in elm](https://github.com/afcastano/elm-nested-component-communication) to [Hyperapp](https://github.com/jorgebucaran/hyperapp/) to show how to build hyperapp apps with nested components without a function equivalent to `Html.map` in Elm.

## Problem

Given a child component below:

child.ts:

```typescript
export type Child = { count: number };

function UpdateChild(model: Child): Child;

export view(model: Child): ElementVNode<Child> {
  return h("button", { onclick: UpdateChild }, text("child"));
}
```

Wrapping the `Child` component doesn't work:

parent.ts:

```typescript
import * as Child from './child';

type Parent = { child1: Child, child2: Child };

function UpdateParent(model: Parent): Parent;

view(model: Parent): ElementVNode<Parent> {
  return h("div",
    {
      onclick: UpdatParent,
    },
    [
      Child.view(model.child1), // Type Error!
      Child.view(model.child2), // Type Error!
    ]
  );
}

app({
  view,
  // ...
})
```

Because `Child.map` returns `ElementVNode<Child>`, while parent's `view` function returns `ElementVNode<Parent>` since the event handlers passed to `h` function (`UpdateChild` and `UpdateParent`) are for different models. In addition to the type mismatch, this example lacks essential information: **To which `Child` (`child1`? Or `child2`?) hyperapp applies the action dispatched from the `Child` components**.

## Solution

In Elm, we usually use `Html.map` to convert child components' `Msg` into their parents' (see the [original example](https://github.com/afcastano/elm-nested-component-communication) for details). But hyperapp doesn't have such a function. [I once implemented such a function](https://github.com/igrep/hyperapp-nested-component/blob/fd202ebd3174389cb7e957c6bf88b8963a01b984/index.ts#L7-L142), but I found I shouldn't propose this change to keep hyperapp simple. Instead of the `Html.map` equivalent, I adopted simpler (but with more boilerplate) way:

child.ts:

```typescript
export type Child = { count: number };

// A helper type
export type LiftAction<C, P> = (childAction: (model: C) => C) => Action<P>

function UpdateChild(model: Child): Child;

export view<P>(model: Child, liftAction: LiftAction<Child, P>): ElementVNode<P> {
  return h("button", { onclick: liftAction(UpdateChild) }, text("child"));
}
```

parent.ts:

```typescript
import * as Child from './child';

type Parent = { child1: Child, child2: Child };

function UpdateParent(model: Parent): Parent;

const Child1 = (model: Parent) => (childAction: (model: Child) => Child): Parent {
  return {
    ... model,
    child1: childAction(model.child1),
  };
}

const Child2 = (model: Parent) => (childAction: (model: Child) => Child): Parent {
  return {
    ... model,
    child2: childAction(model.child2),
  };
}

view(model: Parent): ElementVNode<Parent> {
  return h("div",
    {
      onclick: UpdatParent,
    },
    [
      Child.view(model.child1, Child1(model)),
      Child.view(model.child2, Child2(model)),
    ]
  );
}

app({
  view,
  // ...
})
```

In short, pass functions to handle `Child` components' action (`Child1` and `Child2` in this case) down to the `Child` components. This is somewhat cumbersome, but simple and works perfectly!

## About the Example App

I created an example app to demonstrate how to adopt this solution for more complex apps. You can run the example app at [StackBlitz](https://stackblitz.com/edit/typescript-dpfbvm?file=index.ts) or by following the instructions after cloning this repository:

```bash
npm i
make
```
