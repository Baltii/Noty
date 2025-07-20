import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

function createTextStore() {
	const { subscribe, set, update } = writable<string>('');

	let saveTimeout: ReturnType<typeof setTimeout>;

	return {
		subscribe,
		set,
		update,
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('noty-text');
				if (stored) {
					set(stored);
				}
			}
		},
		updateAndSave: (text: string) => {
			set(text);
			if (browser) {
				// Auto-save with debounce
				clearTimeout(saveTimeout);
				saveTimeout = setTimeout(() => {
					localStorage.setItem('noty-text', text);
				}, 500);
			}
		},
		clear: () => {
			set('');
			if (browser) {
				localStorage.removeItem('noty-text');
			}
		}
	};
}

export const textContent = createTextStore();

// Derived store for word and character count
export const textStats = derived(textContent, ($text) => {
	const words = $text.trim() ? $text.trim().split(/\s+/).length : 0;
	const characters = $text.length;
	const charactersNoSpaces = $text.replace(/\s/g, '').length;

	return {
		words,
		characters,
		charactersNoSpaces
	};
});
