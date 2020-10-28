import psList from 'ps-list';
import { spawn, exec } from 'child_process';

export const getPlatformName = () => {
    switch (process.platform) {
        case 'win32':
            return 'win';
        case 'darwin':
            return 'mac';
        default:
            // return process.platform;
            return 'linux';
    }
};

export const getPlatformExt = () => {
    switch (process.platform) {
        case 'win32':
            return '.exe';
        default:
            return '';
    }
};

export const getProcessId = async (processName: string): Promise<number | undefined> => {
    const processes = await psList();
    // TODO: ps-list version 7.2.0 started to include full path (at least in a dev env) in process.name, the name is even truncated to 15 chars thus find below fails
    const bridgeProcess = processes.find(ps => ps.name.includes(processName));
    return bridgeProcess?.pid;
};

export const isProcessRunning = async (processName: string): Promise<boolean> => {
    const pid = await getProcessId(processName);
    return pid !== undefined;
};

export const runProcess = (bin: string, args: string[] = []): void => {
    const spawnedProcess = spawn(bin, args, {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
    });
    spawnedProcess.on('error', err => {
        console.error(err);
    });
};

export const killProcess = async (processName: string): Promise<void> => {
    const pid = await getProcessId(processName);
    if (pid) {
        exec(`kill -9 ${pid}`, (error, _stdout, stderr) => {
            if (error) {
                console.error(error);
                return;
            }
            console.log(`${stderr}`);
        });
    }
};
