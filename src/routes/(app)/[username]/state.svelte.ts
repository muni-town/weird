import type { Profile } from '$lib/leaf/profile';

export const editingState: { editing: boolean; profile: Profile } = $state({
	editing: false,
	profile: { tags: [], links: [] }
});
