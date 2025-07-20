import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>('dark');

	return {
		subscribe,
		set,
		update,
		toggle: () => update((theme) => (theme === 'light' ? 'dark' : 'light')),
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('theme') as Theme;
				const theme = stored || 'dark';
				set(theme);
				document.documentElement.classList.toggle('dark', theme === 'dark');
			}
		},
		setTheme: (theme: Theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);
				document.documentElement.classList.toggle('dark', theme === 'dark');
			}
			set(theme);
		}
	};
}

export const theme = createThemeStore();
