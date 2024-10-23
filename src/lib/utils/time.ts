export function dateToUnixTimestamp(date: Date): bigint {
	return BigInt(Math.round((date?.getTime() || Date.now()) / 1000));
}

export function dateFromUnixTimestamp(timestamp: number | bigint): Date {
	return new Date(Number(timestamp) * 1000);
}
