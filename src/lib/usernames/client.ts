export const validUsernameRegex = /^([a-z0-9][_-]?){3,32}$/;
export const validUnsubscribedUsernameRegex = /^([a-z0-9][_-]?){3,32}[0-9]{4}$/;

export const validDomainRegex = /^([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,12}(:[0-9]{1,5})?$/;

export function genRandomUsernameSuffix() {
	return Math.floor(Math.random() * (9999 - 1000 + 1) + 1000).toString();
}
