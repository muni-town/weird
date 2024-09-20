import Keyv from 'keyv';

// TODO: allow using Redis for key-value storage so that it can be clustered properly.
const store = new Keyv({ namespace: 'dns-challenge' });

export const createChallenge = async (userId: string): Promise<string> => {
	const challengeId = crypto.randomUUID();
	await store.set(challengeId, userId, 30 * 60 * 1000);
	return challengeId;
};

export const validateChallenge = async (challengeId: string, userId: string): Promise<boolean> => {
	return (await store.get(challengeId)) == userId;
};
