import path from 'path';

import { getPlatformExt, killProcess, runProcess } from '../utils/process';
import { RESOURCES } from '../constants';

export type Status = {
    service: boolean;
    process: boolean;
};

class BaseProcess {
    processName = '';
    resourceName = '';
    runBySuite = false;

    /**
     * Returns the status of the service/process
     * - service: The service is working
     * - process: The process is running
     */
    async status() {
        return {
            service: false,
            process: false,
        };
    }

    /**
     * Start the bundled process
     * @param force Force the launch (will also terminate any other processes with that name)
     * @param params Command line parameters for the process
     */
    async start(force = false, params: string[] = []) {
        const { process, service } = await this.status();

        // Service is running, nothing to do
        if (!force && service) {
            return;
        }

        // If the process is running but the service isn't
        if (process || force) {
            // Stop the process
            await this.stop(!force);
        }

        const extension = getPlatformExt();
        const processPath = path.join(RESOURCES, this.resourceName, this.processName);
        await runProcess(`${processPath}${extension}`, params);
        this.runBySuite = true;
    }

    /**
     * Stops the process
     * @param onlySub Only terminate the bundled process
     */
    async stop(onlySub = true) {
        if (onlySub && !this.runBySuite) {
            return;
        }

        const { process } = await this.status();
        if (!process) {
            return;
        }

        await killProcess(this.processName);
    }

    /**
     * Restart the process
     * @param force Force the restart
     */
    async restart(force = false) {
        // No need to stop it if force is false because start will
        // kill the process anyway before starting it when its force
        // parameter is true.
        if (!force) {
            await this.stop();
        }

        await this.start(force);
    }
}

export default BaseProcess;
