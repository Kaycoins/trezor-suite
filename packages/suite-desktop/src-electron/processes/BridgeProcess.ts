import fetch from 'node-fetch';

import BaseProcess, { Status } from './BaseProcess';
import { isProcessRunning, getPlatformName } from '../utils/process';

class BridgeProcess extends BaseProcess {
    constructor() {
        super();

        this.processName = `trezord-${getPlatformName()}-x64`;
        this.resourceName = 'bridge';
    }

    async status(): Promise<Status> {
        // service
        try {
            const resp = await fetch(`http://127.0.0.1:21325/status/`);
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
        const running = await isProcessRunning(this.processName);
        return {
            service: false,
            process: running,
        };
    }

    async startDev(force = false): Promise<void> {
        await this.start(force, ['-e', '21324']);
    }
}

export default BridgeProcess;
