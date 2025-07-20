<script lang="ts">
	import { Plus, FileText, MoreVertical, Trash, Edit3 } from 'lucide-svelte';
	import { notesStore, activeNote, type Note } from '$lib/stores/notes';
	import { createEventDispatcher, onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	const dispatch = createEventDispatcher();

	let isCollapsed = $state(true);
	let editingId = $state<string | null>(null);
	let editingTitle = $state('');
	let isMobile = $state(false);

	onMount(() => {
		// Check if mobile on mount
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
			// On mobile, start collapsed
			if (isMobile && !isCollapsed) {
				isCollapsed = true;
				dispatch('toggle', isCollapsed);
			}
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);
		
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	function createNewNote() {
		notesStore.createNote();
		// Auto-expand sidebar after creating note for better UX
		if (isCollapsed) {
			isCollapsed = false;
			dispatch('toggle', isCollapsed);
		}
	}

	function selectNote(id: string) {
		notesStore.setActiveNote(id);
	}

	function deleteNote(note: Note, event: Event) {
		event.stopPropagation();
		if (confirm(`Delete "${note.title}"?`)) {
			notesStore.deleteNote(note.id);
		}
	}

	function startEditing(note: Note, event: Event) {
		event.stopPropagation();
		editingId = note.id;
		editingTitle = note.title;
	}

	function finishEditing() {
		if (editingId && editingTitle.trim()) {
			notesStore.renameNote(editingId, editingTitle.trim());
		}
		editingId = null;
		editingTitle = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			finishEditing();
		} else if (event.key === 'Escape') {
			editingId = null;
			editingTitle = '';
		}
	}

	function formatDate(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		
		if (days === 0) {
			return 'Today';
		} else if (days === 1) {
			return 'Yesterday';
		} else if (days < 7) {
			return `${days} days ago`;
		} else {
			return date.toLocaleDateString();
		}
	}

	function toggleSidebar() {
		isCollapsed = !isCollapsed;
		dispatch('toggle', isCollapsed);
	}
</script>

<aside class="h-full bg-background/50 backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out border-r border-border/30 {isCollapsed ? (isMobile ? 'w-20' : 'w-16') : isMobile ? 'fixed inset-y-0 left-0 w-80 z-50 shadow-xl' : 'w-72'}">
	<!-- Mobile overlay when sidebar is open -->
	{#if !isCollapsed && isMobile}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div 
			class="fixed inset-0 bg-black/50 z-40"
			onclick={toggleSidebar}
			role="button"
			tabindex="0"
		></div>
	{/if}

	<!-- Header -->
	<div class="p-3 border-b border-border/30 flex items-center justify-between">
		{#if !isCollapsed}
			<h2 class="font-medium text-base text-foreground/90 transition-opacity duration-200">Notes</h2>
		{/if}
		<Button
			variant="ghost"
			size="icon"
			class="h-8 w-8 {isCollapsed ? 'mx-auto bg-muted/20 hover:bg-muted/40' : ''} hover:bg-muted/50 transition-all duration-200 {isCollapsed ? 'rounded-lg' : ''}"
			onclick={toggleSidebar}
			aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if isCollapsed}
				<Plus class="h-4 w-4 text-foreground" />
			{:else}
				<FileText class="h-3.5 w-3.5 text-muted-foreground" />
			{/if}
		</Button>
	</div>

	{#if !isCollapsed}
		<!-- New Note Button -->
		<div class="p-3 border-b border-border/30">
			<Button 
				onclick={createNewNote}
				class="w-full justify-start gap-2 h-8 text-sm bg-muted/30 hover:bg-muted/60 border-border/50 transition-all duration-200"
				variant="outline"
			>
				<Plus class="h-3.5 w-3.5" />
				New Note
			</Button>
		</div>

		<!-- Notes List -->
		<div class="flex-1 overflow-y-auto custom-scrollbar">
			{#each $notesStore as note (note.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="group relative border-b border-border/20 cursor-pointer hover:bg-muted/30 transition-all duration-200 ease-in-out {$activeNote?.id === note.id ? 'bg-muted/40 border-l-2 border-l-primary' : ''}"
					onclick={() => selectNote(note.id)}
					role="button"
					tabindex="0"
				>
					<div class="p-3">
						{#if editingId === note.id}
							<!-- svelte-ignore a11y_autofocus -->
							<input
								bind:value={editingTitle}
								onkeydown={handleKeydown}
								onblur={finishEditing}
								class="w-full bg-transparent border-none outline-none text-sm font-medium text-foreground"
								autofocus
							/>
						{:else}
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1 min-w-0">
									<h3 class="font-medium text-sm truncate mb-1 text-foreground/90 transition-colors duration-200">
										{note.title}
									</h3>
									<p class="text-xs text-muted-foreground/80 transition-colors duration-200">
										{formatDate(note.updatedAt)}
									</p>
								</div>
								
								<div class="opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out flex gap-1 translate-x-2 group-hover:translate-x-0">
									<Button
										variant="ghost"
										size="icon"
										class="h-5 w-5 hover:bg-muted/60 transition-all duration-150"
										onclick={(e) => startEditing(note, e)}
										aria-label="Rename note"
									>
										<Edit3 class="h-2.5 w-2.5 text-muted-foreground" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="h-5 w-5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
										onclick={(e) => deleteNote(note, e)}
										aria-label="Delete note"
									>
										<Trash class="h-2.5 w-2.5" />
									</Button>
								</div>
							</div>

							<!-- Preview of content -->
							<div class="mt-2 text-xs text-muted-foreground/70 line-clamp-2 transition-colors duration-200 leading-relaxed">
								{note.content.replace(/<[^>]*>/g, '').substring(0, 80)}{note.content.replace(/<[^>]*>/g, '').length > 80 ? '...' : ''}
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div class="p-6 text-center text-muted-foreground/70 animate-fade-in">
					<FileText class="h-10 w-10 mx-auto mb-3 opacity-40 transition-opacity duration-300" />
					<p class="text-sm font-medium mb-1">No notes yet</p>
					<p class="text-xs opacity-80">Create your first note to get started</p>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Collapsed state - show note count indicator and new note button -->
		<div class="flex-1 flex flex-col items-center justify-center p-2 gap-3">
			<!-- New Note Button for collapsed state -->
			<Button
				onclick={createNewNote}
				variant="ghost"
				size="icon"
				class="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200 hover:scale-105 border border-primary/20"
				aria-label="Create new note"
			>
				<Plus class="h-4 w-4 text-primary" />
			</Button>
			
			<div class="text-center text-muted-foreground/60">
				<div class="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center mb-2 transition-colors duration-200 hover:bg-muted/50">
					<span class="text-xs font-medium">{$notesStore.length}</span>
				</div>
				<p class="text-xs transform -rotate-90 whitespace-nowrap">Notes</p>
			</div>
		</div>
	{/if}
</aside>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: hsl(var(--muted-foreground) / 0.3);
		border-radius: 2px;
		transition: background-color 0.2s ease;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: hsl(var(--muted-foreground) / 0.5);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	/* Smooth hover transitions for note items */
	:global(.group) {
		position: relative;
	}

	:global(.group::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, transparent, hsl(var(--muted) / 0.1), transparent);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	:global(.group:hover::before) {
		opacity: 1;
	}
</style>
