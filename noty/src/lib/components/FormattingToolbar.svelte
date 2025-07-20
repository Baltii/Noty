<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { 
		Bold, 
		Italic, 
		Strikethrough, 
		Code, 
		List, 
		ListOrdered, 
		Quote,
		Link2,
		Image,
		Undo,
		Redo,
		ChevronUp,
		ChevronDown,
		Type
	} from 'lucide-svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	interface Props {
		currentHeadingLevel?: 0 | 1 | 2 | 3;
	}

	let { currentHeadingLevel = 0 }: Props = $props();

	const dispatch = createEventDispatcher<{
		bold: void;
		italic: void;
		strike: void;
		code: void;
		heading: { level: 0 | 1 | 2 | 3 };
		bulletList: void;
		orderedList: void;
		blockquote: void;
		setLink: { url: string };
		insertImage: { url: string; alt: string };
		undo: void;
		redo: void;
	}>();

	let isVisible = $state(false);
	let isCollapsed = $state(false);
	
	// Simple heading level tracking
	let selectedHeadingLevel = $state<0 | 1 | 2 | 3>(0);
	
	// Update selected level when currentHeadingLevel changes
	$effect(() => {
		selectedHeadingLevel = currentHeadingLevel;
	});
	
	// Link popover state
	let linkOpen = $state(false);
	let linkUrl = $state('');
	
	// Image popover state  
	let imageOpen = $state(false);
	let imageUrl = $state('');
	let imageAlt = $state('');

	const headingOptions = [
		{ value: '0', label: 'Paragraph', level: 0 },
		{ value: '1', label: 'Heading 1', level: 1 },
		{ value: '2', label: 'Heading 2', level: 2 },
		{ value: '3', label: 'Heading 3', level: 3 }
	] as const;

	function handleAction(action: string) {
		dispatch(action as any);
	}

	function handleHeadingChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const level = parseInt(target.value) as 0 | 1 | 2 | 3;
		console.log('Heading selector changed to level:', level);
		dispatch('heading', { level });
	}

	function handleLinkSubmit() {
		if (linkUrl.trim()) {
			dispatch('setLink', { url: linkUrl.trim() });
			linkUrl = '';
			linkOpen = false;
		}
	}

	function handleImageSubmit() {
		if (imageUrl.trim()) {
			dispatch('insertImage', { url: imageUrl.trim(), alt: imageAlt.trim() });
			imageUrl = '';
			imageAlt = '';
			imageOpen = false;
		}
	}

	export function show() {
		isVisible = true;
	}

	export function hide() {
		isVisible = false;
	}

	export function toggle() {
		isVisible = !isVisible;
	}

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}
</script>

{#if isVisible}
	<div 
		class="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-40 bg-background/80 backdrop-blur-md border border-border/50 rounded-lg shadow-lg transition-all duration-300 animate-slide-down max-w-[95vw] overflow-x-auto"
		role="toolbar"
		aria-label="Text formatting toolbar"
	>
		<!-- Toolbar Content -->
		{#if !isCollapsed}
			<div class="p-1.5 md:p-2 flex items-center gap-0.5 md:gap-1 animate-expand-in min-w-max">
				<!-- Undo/Redo -->
				<Button
					variant="ghost"
					size="icon"
					class="h-6 w-6 md:h-7 md:w-7 transition-all duration-200 hover:bg-muted/50 shrink-0"
					onclick={() => handleAction('undo')}
					aria-label="Undo"
				>
					<Undo class="h-3 w-3 md:h-3.5 md:w-3.5" />
				</Button>
				
				<Button
					variant="ghost"
					size="icon"
					class="h-6 w-6 md:h-7 md:w-7 transition-all duration-200 hover:bg-muted/50 shrink-0"
					onclick={() => handleAction('redo')}
					aria-label="Redo"
				>
					<Redo class="h-3 w-3 md:h-3.5 md:w-3.5" />
				</Button>

				<div class="w-px h-3 md:h-4 bg-border/40 mx-0.5 md:mx-1 shrink-0"></div>

				<!-- Simple Title Size Selector -->
				<div class="flex items-center gap-1 shrink-0">
					<Type class="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" />
					<select 
						bind:value={selectedHeadingLevel}
						onchange={handleHeadingChange}
						class="h-6 md:h-7 px-1.5 md:px-2 text-xs bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[80px] md:min-w-[100px]"
					>
						{#each headingOptions as option}
							<option value={option.level}>{option.label}</option>
						{/each}
					</select>
				</div>

				<div class="w-px h-3 md:h-4 bg-border/40 mx-0.5 md:mx-1 shrink-0"></div>

				<!-- Text Formatting -->
				<Button
					variant="ghost"
					size="icon"
					class="h-6 w-6 md:h-7 md:w-7 transition-all duration-200 hover:bg-muted/50 shrink-0"
					onclick={() => handleAction('bold')}
					aria-label="Bold"
				>
					<Bold class="h-3 w-3 md:h-3.5 md:w-3.5" />
				</Button>
				
				<Button
					variant="ghost"
					size="icon"
					class="h-6 w-6 md:h-7 md:w-7 transition-all duration-200 hover:bg-muted/50 shrink-0"
					onclick={() => handleAction('italic')}
					aria-label="Italic"
				>
					<Italic class="h-3 w-3 md:h-3.5 md:w-3.5" />
				</Button>
				
				<Button
					variant="ghost"
					size="icon"
					class="h-6 w-6 md:h-7 md:w-7 transition-all duration-200 hover:bg-muted/50 shrink-0"
					onclick={() => handleAction('strike')}
					aria-label="Strikethrough"
				>
					<Strikethrough class="h-3 w-3 md:h-3.5 md:w-3.5" />
				</Button>
				
				<Button
					variant="ghost"
					size="icon"
					class="h-6 w-6 md:h-7 md:w-7 transition-all duration-200 hover:bg-muted/50 shrink-0"
					onclick={() => handleAction('code')}
					aria-label="Inline code"
				>
					<Code class="h-3 w-3 md:h-3.5 md:w-3.5" />
				</Button>

				<div class="w-px h-3 md:h-4 bg-border/40 mx-0.5 md:mx-1 shrink-0"></div>

				<!-- Lists and Quote -->
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7 transition-all duration-200 hover:bg-muted/50"
					onclick={() => handleAction('bulletList')}
					aria-label="Bullet list"
				>
					<List class="h-3.5 w-3.5" />
				</Button>
				
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7 transition-all duration-200 hover:bg-muted/50"
					onclick={() => handleAction('orderedList')}
					aria-label="Numbered list"
				>
					<ListOrdered class="h-3.5 w-3.5" />
				</Button>
				
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7 transition-all duration-200 hover:bg-muted/50"
					onclick={() => handleAction('blockquote')}
					aria-label="Quote"
				>
					<Quote class="h-3.5 w-3.5" />
				</Button>

				<div class="w-px h-4 bg-border/40 mx-1"></div>

				<!-- Link Popover -->
				<Popover.Root bind:open={linkOpen}>
					<Popover.Trigger>
						<Button
							variant="ghost"
							size="icon"
							class="h-7 w-7 transition-all duration-200 hover:bg-muted/50"
							aria-label="Add Link"
						>
							<Link2 class="h-3.5 w-3.5" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-80">
						<div class="space-y-3">
							<div class="space-y-2">
								<h4 class="font-medium leading-none">Add Link</h4>
								<p class="text-sm text-muted-foreground">
									Enter the URL for the link.
								</p>
							</div>
							<div class="space-y-2">
								<Label for="link-url">URL</Label>
								<Input
									id="link-url"
									bind:value={linkUrl}
									placeholder="https://example.com"
									onkeydown={(e) => e.key === 'Enter' && handleLinkSubmit()}
								/>
							</div>
							<div class="flex gap-2">
								<Button size="sm" onclick={handleLinkSubmit}>Add Link</Button>
								<Button size="sm" variant="outline" onclick={() => linkOpen = false}>Cancel</Button>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
				
				<!-- Image Popover -->
				<Popover.Root bind:open={imageOpen}>
					<Popover.Trigger>
						<Button
							variant="ghost"
							size="icon"
							class="h-7 w-7 transition-all duration-200 hover:bg-muted/50"
							aria-label="Add Image"
						>
							<Image class="h-3.5 w-3.5" />
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-80">
						<div class="space-y-3">
							<div class="space-y-2">
								<h4 class="font-medium leading-none">Add Image</h4>
								<p class="text-sm text-muted-foreground">
									Enter the image URL and optional alt text.
								</p>
							</div>
							<div class="space-y-2">
								<Label for="image-url">Image URL</Label>
								<Input
									id="image-url"
									bind:value={imageUrl}
									placeholder="https://example.com/image.jpg"
								/>
							</div>
							<div class="space-y-2">
								<Label for="image-alt">Alt Text (optional)</Label>
								<Input
									id="image-alt"
									bind:value={imageAlt}
									placeholder="Describe the image"
									onkeydown={(e) => e.key === 'Enter' && handleImageSubmit()}
								/>
							</div>
							<div class="flex gap-2">
								<Button size="sm" onclick={handleImageSubmit}>Add Image</Button>
								<Button size="sm" variant="outline" onclick={() => imageOpen = false}>Cancel</Button>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>

				<div class="w-px h-4 bg-border/40 mx-1"></div>

				<!-- Collapse Button -->
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7 transition-all duration-200 hover:bg-muted/50"
					onclick={toggleCollapse}
					aria-label="Collapse toolbar"
				>
					<ChevronUp class="h-3.5 w-3.5" />
				</Button>
			</div>
		{:else}
			<!-- Collapsed state - just the expand button -->
			<div class="p-2 animate-collapse-in">
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7 transition-all duration-200 hover:bg-muted/50 hover:scale-105"
					onclick={toggleCollapse}
					aria-label="Expand toolbar"
				>
					<ChevronDown class="h-3.5 w-3.5 animate-pulse" />
				</Button>
			</div>
		{/if}
	</div>
{/if}

<style>
	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translate(-50%, -10px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	@keyframes expand-in {
		from {
			opacity: 0;
			transform: scaleX(0.3);
			transform-origin: center;
		}
		to {
			opacity: 1;
			transform: scaleX(1);
		}
	}

	@keyframes collapse-in {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes bounce-in {
		0% {
			transform: scale(0.8);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}

	.animate-slide-down {
		animation: slide-down 0.3s ease-out;
	}

	.animate-expand-in {
		animation: expand-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.animate-collapse-in {
		animation: collapse-in 0.3s ease-out, bounce-in 0.6s ease-out 0.3s;
	}
</style>
