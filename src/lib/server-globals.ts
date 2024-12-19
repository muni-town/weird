import type { CronJob } from 'cron';
import type { DefaultServer } from 'dinodns/common/server';

/**
 * This is a helper module to allow for the DNS server and other server globals to gracefully hot
 * reload during development.
 *
 * Every time the DNS server, for example, or any module it imports changes, it will get re-run,
 * without the opportunity for us to shut down the already running DNS server which is using the
 * system ports that we need.
 *
 * By storing the running DNS server in a separate module, we are able to detect that the DNS server
 * has already been started, and then shut down the old one before running the rest of the module.
 *
 * Having this module here, then, makes sure the server can hot reload completely fine as long as we
 * don't change _this_ file, which is not a problem because it exists only for exporting this
 * variable that never needs to change during development.
 * */
export const serverGlobals: { dnsServer?: DefaultServer; cronJobs?: CronJob[] } = {};
