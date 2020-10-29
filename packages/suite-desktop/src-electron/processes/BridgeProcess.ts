import fetch from 'node-fetch';

import BaseProcess, { Status } from './BaseProcess';

class BridgeProcess extends BaseProcess {
    constructor() {
        super();

        this.processName = `trezord`;
        this.resourceName = 'bridge';
    }

    async status(): Promise<Status> {
        // service
        try {
            const resp = await fetch(`http://127.0.0.1:21325/status/`);
            console.log(resp);
            if (resp.status === 200) {
                return {
                    service: true,
                    process: true,
                };
            }
        } catch {
            //
        }

        // process
        return {
            service: false,
            process: Boolean(this.process),
        };
    }

    async startDev(): Promise<void> {
        await this.start(['-e', '21324']);
    }
}

export default BridgeProcess;
