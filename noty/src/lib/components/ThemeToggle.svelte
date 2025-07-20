<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Moon, Sun } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	onMount(() => {
		theme.init();
	});

	function toggleTheme() {
		theme.toggle();
		theme.subscribe((t) => theme.setTheme(t))();
	}
</script>

<Button
	variant="ghost"
	size="icon"
	class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 hover:bg-muted/40 shrink-0"
	onclick={toggleTheme}
	aria-label="Toggle theme"
>
	{#if $theme === 'dark'}
		<Sun class="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-500 transition-transform duration-200 hover:scale-110" />
	{:else}
		<Moon class="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500 transition-transform duration-200 hover:scale-110" />
	{/if}
</Button>
