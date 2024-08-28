import { browser } from '$app/environment';
import ws from 'ws';

if (!browser) {
	global.WebSocket = ws as any;
}
