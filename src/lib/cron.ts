import { serverGlobals } from '$lib/server-globals';
import { dev } from '$app/environment';
import { usernames } from './usernames';

export const startCronJobs = () => {
	// Handles hot reloading during development
	if (dev) {
		if (serverGlobals.cronJobs) {
			for (const job of serverGlobals.cronJobs) {
				job.stop();
			}
			serverGlobals.cronJobs = undefined;
		}
	}

	serverGlobals.cronJobs = [usernames.cronJob()];

	for (const job of serverGlobals.cronJobs || []) {
		job.start();
	}
};
