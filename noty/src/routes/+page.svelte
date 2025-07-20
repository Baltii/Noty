<script lang="ts">
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import FloatingDock from '$lib/components/FloatingDock.svelte';
	import NoteSidebar from '$lib/components/NoteSidebar.svelte';
	import FormattingToolbar from '$lib/components/FormattingToolbar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';
	import { notesStore, activeNote } from '$lib/stores/notes';
	import { onMount, tick } from 'svelte';

	let editorComponent: RichTextEditor | undefined = $state();
	let formattingToolbar: FormattingToolbar | undefined = $state();
	let sidebarCollapsed = $state(true); // Start with sidebar closed
	let soundEnabled = $state(false);
	let currentHeadingLevel = $state<0 | 1 | 2 | 3>(0);
	let isMobile = $state(false);

	onMount(() => {
		// Check if mobile
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		
		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Initialize notes store
		notesStore.init();
		
		// Create first note if none exist
		notesStore.subscribe(notes => {
			if (notes.length === 0) {
				notesStore.createNote('Welcome to Noty');
			}
		})();

		// Set default dark theme
		document.documentElement.classList.add('dark');
		
		// Ensure toolbar is visible when there's an active note
		activeNote.subscribe(note => {
			if (note && formattingToolbar) {
				formattingToolbar.show();
			}
		});
		
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	// Effect to show toolbar when active note changes
	$effect(() => {
		if ($activeNote && formattingToolbar) {
			tick().then(() => {
				formattingToolbar.show();
			});
		}
	});

	function handleShare() {
		if (!$activeNote || !editorComponent) return;
		
		const textContent = editorComponent.getTextContent();
		if (navigator.share && textContent.trim()) {
			navigator.share({
				title: $activeNote.title,
				text: textContent
			}).catch(() => {
				// Fallback to clipboard
				copyToClipboard(textContent);
			});
		} else {
			copyToClipboard(textContent);
		}
	}

	function copyToClipboard(text: string) {
		if (navigator.clipboard && text.trim()) {
			navigator.clipboard.writeText(text).then(() => {
				console.log('Text copied to clipboard');
			});
		}
	}

	function handleDownload() {
		if (!$activeNote || !editorComponent) return;
		
		const textContent = editorComponent.getTextContent();
		if (!textContent.trim()) return;
		
		const blob = new Blob([textContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${$activeNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handlePrint() {
		if (!$activeNote || !editorComponent) return;
		
		const textContent = editorComponent.getTextContent();
		if (!textContent.trim()) return;
		
		const printWindow = window.open('', '_blank');
		if (printWindow) {
			printWindow.document.write(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>${$activeNote.title}</title>
					<style>
						body {
							font-family: system-ui, -apple-system, sans-serif;
							line-height: 1.6;
							max-width: 800px;
							margin: 0 auto;
							padding: 20px;
						}
						pre {
							white-space: pre-wrap;
							word-wrap: break-word;
						}
					</style>
				</head>
				<body>
					<h1>${$activeNote.title}</h1>
					<pre>${textContent}</pre>
				</body>
				</html>
			`);
			printWindow.document.close();
			printWindow.print();
		}
	}

	function handleUndo() {
		editorComponent?.undo();
	}

	function handleToggleSound(event: CustomEvent<boolean>) {
		soundEnabled = event.detail;
	}

	function handleToggleFormatting() {
		formattingToolbar?.toggle();
	}

	function handleSidebarToggle(event: CustomEvent<boolean>) {
		sidebarCollapsed = event.detail;
	}

	// Formatting toolbar handlers
	function handleBold() { editorComponent?.toggleBold(); }
	function handleItalic() { editorComponent?.toggleItalic(); }
	function handleStrike() { editorComponent?.toggleStrike(); }
	function handleCode() { editorComponent?.toggleCode(); }
	function handleHeading(event: CustomEvent<{ level: 0 | 1 | 2 | 3 }>) { 
		console.log('Main page handleHeading called with level:', event.detail.level);
		editorComponent?.setHeading(event.detail.level); 
	}
	function handleBulletList() { editorComponent?.toggleBulletList(); }
	function handleOrderedList() { editorComponent?.toggleOrderedList(); }
	function handleBlockquote() { editorComponent?.toggleBlockquote(); }
	function handleSetLink(event: CustomEvent<{ url: string }>) { 
		editorComponent?.setLink(event.detail.url); 
	}
	function handleInsertImage(event: CustomEvent<{ url: string; alt: string }>) { 
		editorComponent?.insertImage(event.detail.url, event.detail.alt); 
	}
	function handleFormattingUndo() { editorComponent?.undo(); }
	function handleFormattingRedo() { editorComponent?.redo(); }

	function updateToolbarState() {
		if (editorComponent) {
			currentHeadingLevel = editorComponent.getCurrentHeadingLevel();
		}
	}

	function handleCreateNewNote() {
		notesStore.createNote();
	}
</script>

<main class="h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
	<!-- Sidebar - Hidden on mobile by default -->
	<NoteSidebar on:toggle={handleSidebarToggle} />
	
	<!-- Main Content -->
	<div class="flex-1 flex flex-col transition-all duration-300 min-h-0">
		{#if $activeNote}
			<div class="flex-1 overflow-auto">
				<RichTextEditor 
					bind:this={editorComponent}
					soundEnabled={soundEnabled}
					on:selectionUpdate={updateToolbarState}
				/>
			</div>
		{:else}
			<div class="flex-1 flex items-center justify-center p-4">
				<div class="text-center text-muted-foreground max-w-sm">
					<h2 class="text-xl md:text-2xl font-semibold mb-2">Welcome to Noty</h2>
					<p class="text-sm md:text-base">Create a new note to get started</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Floating Dock -->
	<FloatingDock 
		on:share={handleShare}
		on:download={handleDownload}
		on:print={handlePrint}
		on:undo={handleUndo}
		on:toggleSound={handleToggleSound}
		on:toggleFormatting={handleToggleFormatting}
	/>

	<!-- Formatting Toolbar -->
	<FormattingToolbar 
		bind:this={formattingToolbar}
		currentHeadingLevel={currentHeadingLevel}
		on:bold={handleBold}
		on:italic={handleItalic}
		on:strike={handleStrike}
		on:code={handleCode}
		on:heading={handleHeading}
		on:bulletList={handleBulletList}
		on:orderedList={handleOrderedList}
		on:blockquote={handleBlockquote}
		on:setLink={handleSetLink}
		on:insertImage={handleInsertImage}
		on:undo={handleFormattingUndo}
		on:redo={handleFormattingRedo}
	/>

	<!-- Mobile FAB for creating new notes -->
	{#if isMobile && sidebarCollapsed}
		<Button
			onclick={handleCreateNewNote}
			class="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-30 transition-all duration-200 hover:scale-105"
			aria-label="Create new note"
		>
			<Plus class="h-6 w-6 text-primary-foreground" />
		</Button>
	{/if}
</main>
