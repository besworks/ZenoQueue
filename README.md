[![npm version](https://img.shields.io/npm/v/zeno-queue.svg)](https://www.npmjs.com/package/zeno-queue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zeno-queue)](https://bundlephobia.com/package/zeno-queue)

# ZenoQueue

A minimal, high-performance Promise-based queue.

## Features

- ~40% faster than array-based queues
- Zero dependencies
- Tiny (398 bytes)
- Simple API
- Sequential Promise execution
- AbortController cancellation

## Installation

```shell
npm install zeno-queue
```

or

```js
import { ZenoQueue } from 'https://unpkg.com/zeno-queue/index.js';
```

## Usage

```javascript
import { ZenoQueue } from 'zeno-queue';

const queue = new ZenoQueue();

// Queue an operation
queue(() => {
    console.log('First');
});

// Queue an async operation
queue(async () => {
    await someAsyncWork();
    console.log('Second');
});

// Cancel an operation
const task = queue(processData);
task.abort();
```

**Note**: tasks can only be aborted before they have started. If you need the ability to cancel a long running task, you should use an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) signal in your callback.

```js
const controller = new AbortController();

queue(() => {
    for (let i=0; i<100000; i++) {
        if (controller.signal.aborted) {
            return;
        }
        // your operation goes here
    }
});

controller.abort();
```

## Performance

Tested with 100,000 operations:

```
ZenoQueue:   680.84ms
Array Queue: 1127.90ms
```

## Why ZenoQueue?

ZenoQueue processes operations sequentially with O(1) complexity by chaining Promises rather than using traditional O(n) Array operations.