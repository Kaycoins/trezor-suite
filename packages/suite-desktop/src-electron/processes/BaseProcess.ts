import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { RESOURCES } from '../constants';

export type Status = {
    service: boolean;
    process: boolean;
};

class BaseProcess {
    process: ChildProcess | null;
    resourceName = '';
    processName = '';
    supportedSystems = ['linux-x64', 'mac-x64', 'win-x64'];

    constructor() {
        this.process = null;
    }

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
     * @param params Command line parameters for the process
     */
    async start(params: string[] = []) {
        const { process, service } = await this.status();

        // Service is running, nothing to do
        if (service) {
            return;
        }

        // If the process is running but the service isn't
        if (process) {
            // Stop the process
            await this.stop();
        }

        const { system, ext } = this.getPlatformInfo();
        if (!this.isSystemSupported(system)) {
            throw new Error(`[${this.resourceName}] unsupported system (${system})`);
        }

        const processPath = path.join(
            RESOURCES,
            'bin',
            this.resourceName,
            system,
            `${this.processName}${ext}`,
        );
        this.process = spawn(processPath, params);
    }

    /**
     * Stops the process
     */
    async stop() {
        if (this.process) {
            this.process.kill('SIGINT');
            this.process = null;
        }
    }

    /**
     * Restart the process
     * @param force Force the restart
     */
    async restart() {
        await this.stop();
        await this.start();
    }

    ///
    isSystemSupported(system: string) {
        return this.supportedSystems.includes(system);
    }

    getPlatformInfo() {
        const { arch } = process;
        const platform = this.getPlatform();
        const ext = platform === 'win' ? '.exe' : '';
        const system = `${platform}-${arch}`;
        return { system, platform, arch, ext };
    }

    getPlatform() {
        switch (process.platform) {
            case 'darwin':
                return 'mac';
            case 'win32':
                return 'win';
            default:
                return process.platform;
        }
    }
}

export default BaseProcess;
