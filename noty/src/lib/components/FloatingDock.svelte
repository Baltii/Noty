<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { 
		Download, 
		Printer, 
		Share, 
		Trash, 
		Volume2, 
		VolumeX,
		RotateCcw,
		Type
	} from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { activeNote, notesStore } from '$lib/stores/notes';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		toggleSound: boolean;
		share: void;
		print: void;
		download: void;
		clear: void;
		undo: void;
		toggleFormatting: void;
	}>();

	let soundEnabled = $state(false);
	let formattingVisible = $state(false);

	function handleShare() {
		dispatch('share');
	}

	function handlePrint() {
		dispatch('print');
	}

	function handleDownload() {
		dispatch('download');
	}

	function handleClear() {
		if (!$activeNote) return;
		
		if (confirm('Are you sure you want to clear this note?')) {
			notesStore.updateNote($activeNote.id, { content: '' });
			dispatch('clear');
		}
	}

	function handleUndo() {
		dispatch('undo');
	}

	function toggleSound() {
		soundEnabled = !soundEnabled;
		dispatch('toggleSound', soundEnabled);
	}

	function toggleFormatting() {
		formattingVisible = !formattingVisible;
		dispatch('toggleFormatting');
	}

	// Calculate word count from active note
	const wordCount = $derived(() => {
		if (!$activeNote || !$activeNote.content) return 0;
		
		const textContent = $activeNote.content.replace(/<[^>]*>/g, '').trim();
		if (textContent === '') return 0;
		
		return textContent.split(/\s+/).filter(word => word.length > 0).length;
	});
</script>

<div class="fixed bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
	<div class="flex items-center gap-0.5 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40 border border-border/50 rounded-full p-0.5 md:p-1 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-300 hover:shadow-xl hover:bg-background/70 max-w-[95vw] overflow-x-auto">
		<!-- Theme Toggle -->
		<ThemeToggle />
		
		<!-- Separator -->
		<div class="w-px h-4 md:h-5 bg-border/40 mx-0.5 md:mx-1 shrink-0"></div>
		
		<!-- Formatting Toggle -->
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 {formattingVisible ? 'bg-muted/60 scale-95' : 'hover:bg-muted/40'} shrink-0"
			onclick={toggleFormatting}
			aria-label="Toggle formatting toolbar"
		>
			<Type class="h-3 w-3 md:h-3.5 md:w-3.5" />
		</Button>

		<!-- Sound Toggle -->
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 hover:bg-muted/40 shrink-0"
			onclick={toggleSound}
			aria-label={soundEnabled ? 'Disable typing sounds' : 'Enable typing sounds'}
		>
			{#if soundEnabled}
				<Volume2 class="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
			{:else}
				<VolumeX class="h-3 w-3 md:h-3.5 md:w-3.5" />
			{/if}
		</Button>

		<!-- Separator -->
		<div class="w-px h-4 md:h-5 bg-border/40 mx-0.5 md:mx-1 shrink-0"></div>

		<!-- Undo -->
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 hover:bg-muted/40 shrink-0"
			onclick={handleUndo}
			aria-label="Undo"
		>
			<RotateCcw class="h-3 w-3 md:h-3.5 md:w-3.5" />
		</Button>

		<!-- Clear -->
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 hover:bg-destructive/20 disabled:opacity-50 shrink-0"
			onclick={handleClear}
			aria-label="Clear note"
			disabled={!$activeNote}
		>
			<Trash class="h-3 w-3 md:h-3.5 md:w-3.5" />
		</Button>

		<!-- Separator -->
		<div class="w-px h-4 md:h-5 bg-border/40 mx-0.5 md:mx-1 shrink-0"></div>

		<!-- Share -->
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 hover:bg-muted/40 disabled:opacity-50 shrink-0"
			onclick={handleShare}
			aria-label="Share note"
			disabled={!$activeNote}
		>
			<Share class="h-3 w-3 md:h-3.5 md:w-3.5" />
		</Button>

		<!-- Download -->
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 hover:bg-muted/40 disabled:opacity-50 shrink-0"
			onclick={handleDownload}
			aria-label="Download note"
			disabled={!$activeNote}
		>
			<Download class="h-3 w-3 md:h-3.5 md:w-3.5" />
		</Button>

		<!-- Print -->
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 md:h-8 md:w-8 transition-all duration-200 hover:bg-muted/40 disabled:opacity-50 shrink-0"
			onclick={handlePrint}
			aria-label="Print note"
			disabled={!$activeNote}
		>
			<Printer class="h-3 w-3 md:h-3.5 md:w-3.5" />
		</Button>

		<!-- Separator -->
		<div class="w-px h-4 md:h-5 bg-border/40 mx-0.5 md:mx-1 shrink-0"></div>

		<!-- Word Count Display -->
		<div class="px-2 md:px-3 py-1 md:py-1.5 text-sm text-muted-foreground/80 min-w-0 transition-colors duration-200 shrink-0">
			<span class="font-medium text-xs">{wordCount()}</span>
			<span class="text-xs ml-1 opacity-70 hidden sm:inline">words</span>
			<span class="text-xs ml-1 opacity-70 sm:hidden">w</span>
		</div>
	</div>
</div>

<style>
	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translate(-50%, 20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.4s ease-out;
	}
</style>
