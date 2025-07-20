<script lang="ts">
	import { textContent } from '$lib/stores/text';
	import { onMount } from 'svelte';

	let textareaEl: HTMLTextAreaElement;
	let soundEnabled = $state(false);
	let undoStack: string[] = $state([]);
	let redoStack: string[] = $state([]);

	// Audio context for typing sounds
	let audioContext: AudioContext | null = null;

	onMount(() => {
		textContent.init();
		
		// Initialize audio context for typing sounds
		if (typeof window !== 'undefined') {
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		}

		// Focus the textarea on mount
		textareaEl?.focus();
	});

	function playTypingSound() {
		if (!soundEnabled || !audioContext) return;
		
		try {
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			
			// Create a subtle typing sound
			oscillator.frequency.value = 800 + Math.random() * 200;
			gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
			
			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.1);
		} catch (error) {
			// Silently fail if audio context is not available
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		const newText = target.value;
		
		// Add to undo stack before updating
		if ($textContent !== newText) {
			undoStack.push($textContent);
			// Limit undo stack size
			if (undoStack.length > 50) {
				undoStack.shift();
			}
			redoStack = []; // Clear redo stack when new input is made
		}
		
		textContent.updateAndSave(newText);
		playTypingSound();
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Handle Ctrl+Z for undo
		if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
			event.preventDefault();
			undo();
		}
		// Handle Ctrl+Y or Ctrl+Shift+Z for redo
		else if (event.ctrlKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
			event.preventDefault();
			redo();
		}
	}

	export function undo() {
		if (undoStack.length > 0) {
			const previousText = undoStack.pop()!;
			redoStack.push($textContent);
			textContent.updateAndSave(previousText);
		}
	}

	function redo() {
		if (redoStack.length > 0) {
			const nextText = redoStack.pop()!;
			undoStack.push($textContent);
			textContent.updateAndSave(nextText);
		}
	}

	export function handleShare() {
		if (navigator.share && $textContent.trim()) {
			navigator.share({
				title: 'My Note',
				text: $textContent
			}).catch(() => {
				// Fallback to clipboard
				copyToClipboard();
			});
		} else {
			copyToClipboard();
		}
	}

	function copyToClipboard() {
		if (navigator.clipboard && $textContent.trim()) {
			navigator.clipboard.writeText($textContent).then(() => {
				// You could show a toast notification here
				console.log('Text copied to clipboard');
			});
		}
	}

	export function handleDownload() {
		if (!$textContent.trim()) return;
		
		const blob = new Blob([$textContent], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `note-${new Date().toISOString().split('T')[0]}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	export function handlePrint() {
		if (!$textContent.trim()) return;
		
		const printWindow = window.open('', '_blank');
		if (printWindow) {
			printWindow.document.write(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Note</title>
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
					<pre>${$textContent}</pre>
				</body>
				</html>
			`);
			printWindow.document.close();
			printWindow.print();
		}
	}

	export function toggleSound(enabled: boolean) {
		soundEnabled = enabled;
	}
</script>

<div class="min-h-screen w-full flex flex-col">
	<!-- Main writing area -->
	<div class="flex-1 w-full max-w-4xl mx-auto p-6">
		<textarea
			bind:this={textareaEl}
			bind:value={$textContent}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			class="w-full h-full min-h-[80vh] resize-none border-none outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-lg leading-relaxed font-mono"
			placeholder="Start writing..."
			spellcheck="true"
		></textarea>
	</div>
</div>
