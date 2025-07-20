<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';

	let { children } = $props();

	onMount(() => {
		// Initialize theme on app load
		theme.init();
	});
</script>

<svelte:head>
	<title>Noty - Minimalist Writing Space</title>
	<meta name="description" content="A clean, distraction-free writing environment with auto-save, themes, and essential tools." />
</svelte:head>

{@render children()}
