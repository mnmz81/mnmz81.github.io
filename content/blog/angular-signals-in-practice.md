---
title: Angular Signals in practice
summary: How signals, computed values and effects changed the way I structure state in Angular apps.
date: 2026-08-30
tags: [angular, frontend]
draft: true
---

Signals changed how I think about state in Angular.

## Why signals

A signal is a value that notifies consumers when it changes.

```ts
const count = signal(0);
```

### Computed values

Derived state stays in sync without manual subscriptions.

## Takeaways

- Prefer `computed` over effects for derived state.
