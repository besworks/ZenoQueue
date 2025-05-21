[![npm version](https://img.shields.io/npm/v/zeno-queue.svg)](https://www.npmjs.com/package/zeno-queue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zeno-queue)](https://bundlephobia.com/package/zeno-queue)

# ZenoQueue

A minimal, high-performance Promise-based queue.

## Features

- ~40% faster than array-based queues
- Zero dependencies
- Tiny (398 bytes)
- Simple API
- Promise chaining execution
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

// Cancel an operation before it starts
const task = queue(processData);
task.abort();
```

To cancel an operation that has already started you must access the `.aborted` boolean property of the `context`.

In order to prevent blocking during long running operations you should await `.yield()` after each iteration.

```js
async function longRunningTask(context) {
    console.log('Starting');

    for (let i=0; i<10000; i++) {
        if (context.aborted) {
            console.log('Aborted');
            return;
        }

        console.log(i);
        await context.yield();
    }

    console.log('Done');
}

const task = queue(longRunningTask);
setTimeout(() => task.abort(), 1000);
```

## Performance

ZenoQueue processes sequentially with O(1) complexity by chaining Promises rather than using traditional O(n) Array operations.

Here are the results of a test with 100,000 tasks:

```
ZenoQueue:   680.84ms
Array Queue: 1127.90ms
```

## Limitations

For simple, speedy, sequential job queuing, ZenoQueue is the clear choice. But there are some aspects that may make it be inappropriate for certain use-cases:

- Tasks always execute in FIFO order
- No pause/resume functionality
- Task history must be tracked externally

Use a traditional array-based queue if you need:

- Dynamic task priorities
- Complex queue manipulation
- Easy task tracking