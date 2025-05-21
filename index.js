export class ZenoQueue {
    #queue = Promise.resolve();

    constructor() {
        return (operation) => {
            const controller = new AbortController();
            this.#queue = this.#queue.then(async () => {
                if (!controller.signal.aborted) {
                    await operation({
                        get aborted() { return controller.signal.aborted; },
                        yield: () => new Promise(r => setTimeout(r, 0))
                    });
                }
            });
    
            return controller;
        };
    }
}