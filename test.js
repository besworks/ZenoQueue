import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ZenoQueue } from './index.js';

describe('ZenoQueue', async () => {
    it('executes operations in sequence', async () => {
        const queue = new ZenoQueue();
        const results = [];

        queue(() => results.push(1));
        queue(() => results.push(2));
        queue(() => results.push(3));

        // Allow queue to process
        await new Promise(resolve => setTimeout(resolve, 0));
        
        assert.deepStrictEqual(results, [1, 2, 3]);
    });

    it('handles async operations', async () => {
        const queue = new ZenoQueue();
        const results = [];

        queue(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            results.push(1);
        });

        queue(() => results.push(2));

        await new Promise(resolve => setTimeout(resolve, 20));
        assert.deepStrictEqual(results, [1, 2]);
    });

    it('respects abort signals', async () => {
        const queue = new ZenoQueue();
        const results = [];

        const controller = queue(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            results.push('should not execute');
        });

        controller.abort();
        queue(() => results.push('executed'));

        await new Promise(resolve => setTimeout(resolve, 100));
        assert.deepStrictEqual(results, ['executed']);
    });

    it('continues queue after aborted operation', async () => {
        const queue = new ZenoQueue();
        const results = [];

        queue(() => results.push(1));
        
        const controller = queue(() => {
            results.push('should not execute');
        });
        controller.abort();
        
        queue(() => results.push(3));

        await new Promise(resolve => setTimeout(resolve, 10));
        assert.deepStrictEqual(results, [1, 3]);
    });

    it('handles large operation sets', async () => {
        const queue = new ZenoQueue();
        const results = [];
        const OPERATIONS = 1000;

        // Queue operations
        for (let i = 0; i < OPERATIONS; i++) {
            queue(() => results.push(i));
        }

        // Allow queue to process
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify operations executed in order
        assert.strictEqual(results.length, OPERATIONS);
        assert.strictEqual(results[0], 0);
        assert.strictEqual(results[OPERATIONS - 1], OPERATIONS - 1);
        
        // Check sequence is correct
        for (let i = 0; i < OPERATIONS - 1; i++) {
            assert.strictEqual(results[i + 1] - results[i], 1);
        }
    });

    it('performs faster than array-based queue', async () => {
        const OPERATIONS = 100000;
        
        // Test ZenoQueue
        const zenoQueue = new ZenoQueue();
        const zenoStart = performance.now();
        
        for (let i = 0; i < OPERATIONS; i++) {
            zenoQueue(() => i);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        const zenoDuration = performance.now() - zenoStart;

        // Test Array-based queue
        const arrayQueue = new Array();
        const arrayStart = performance.now();

        for (let i = 0; i < OPERATIONS; i++) {
            arrayQueue.push(i);
        }

        for (let i = 0; i < OPERATIONS; i++) {
            arrayQueue.shift();
        }

        const arrayDuration = performance.now() - arrayStart;

        console.log(`ZenoQueue: ${zenoDuration.toFixed(2)}ms`);
        console.log(`Array Queue: ${arrayDuration.toFixed(2)}ms`);
        
        // ZenoQueue should be significantly faster
        assert.ok(zenoDuration < arrayDuration);
    });

    it('supports abort and yield operations', async () => {
        const queue = new ZenoQueue();
        const results = [];
        let aborted = false;

        const task = queue(async (context) => {
            for (let i = 0; i < 1000; i++) {
                if (context.aborted) {
                    aborted = true;
                    break;
                }
                results.push(i);
                await context.yield();
            }
        });

        // Allow some operations to process
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Abort mid-execution
        task.abort();
        
        // Allow abort to process
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify partial execution and abort
        assert.ok(results.length > 0);
        assert.ok(results.length < 1000);
        assert.ok(aborted);
        
        // Verify sequence is correct up to abort
        for (let i = 0; i < results.length - 1; i++) {
            assert.strictEqual(results[i + 1] - results[i], 1);
        }
    });
});