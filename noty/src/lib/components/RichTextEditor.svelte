<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import Image from '@tiptap/extension-image';
	import { activeNote, notesStore } from '$lib/stores/notes';

	const dispatch = createEventDispatcher<{
		selectionUpdate: void;
	}>();

	let element: HTMLDivElement;
	let editor: Editor | null = $state(null);
	let audioContext: AudioContext | null = null;

	interface Props {
		soundEnabled?: boolean;
	}

	let { soundEnabled = false }: Props = $props();

	onMount(() => {
		// Initialize audio context for typing sounds
		if (typeof window !== 'undefined') {
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		}

		// Initialize TipTap editor with Link and Image support
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure({
					bulletList: {
						keepMarks: true,
						keepAttributes: false,
					},
					orderedList: {
						keepMarks: true,
						keepAttributes: false,
					},
				}),
				Placeholder.configure({
					placeholder: 'Start writing...',
				}),
				Link.configure({
					openOnClick: false,
					HTMLAttributes: {
						class: 'text-primary underline cursor-pointer',
					},
					// Allow exiting links with right arrow key
					exitOnRight: true,
					exitOnArrowRight: true,
				}),
				Image.configure({
					HTMLAttributes: {
						class: 'max-w-full h-auto rounded-lg resizable-image',
					},
					allowBase64: true,
				}),
			],
			content: $activeNote?.content || '',
			editorProps: {
				attributes: {
					class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
					// Mobile-specific attributes for better touch input
					'data-touch-action': 'manipulation',
					'inputmode': 'text',
					'autocomplete': 'off',
					'autocorrect': 'on',
					'autocapitalize': 'sentences',
					'spellcheck': 'true',
					'contenteditable': 'true',
				},
				handleClickOn: (view, pos, node, nodePos, event) => {
					if (node.type.name === 'image') {
						// Handle image selection for resizing
						selectImage(event.target as HTMLImageElement);
						return true;
					}
					return false;
				},
			},
			onUpdate: ({ editor }) => {
				const content = editor.getHTML();
				if ($activeNote && content !== $activeNote.content) {
					notesStore.updateNote($activeNote.id, { content });
				}
				playTypingSound();
				// Set up images after content update
				setTimeout(() => setupAllImages(), 50);
			},
			onSelectionUpdate: () => {
				dispatch('selectionUpdate');
			},
		});

		// Set up all images initially
		setTimeout(() => setupAllImages(), 200);
		
		// Add image resize functionality
		setupImageResize();
		
		// Focus editor after mount for mobile
		setTimeout(() => {
			if (editor && $activeNote) {
				// Only auto-focus on desktop to avoid unwanted keyboard popup on mobile
				const isMobile = window.innerWidth < 768;
				if (!isMobile) {
					editor.commands.focus();
				}
			}
		}, 300);
	});

	// Focus editor when active note changes (important for mobile)
	$effect(() => {
		if (editor && $activeNote) {
			// Small delay to ensure DOM is ready, but don't auto-focus on mobile to avoid keyboard popup
			const isMobile = window.innerWidth < 768;
			if (!isMobile) {
				setTimeout(() => {
					editor.commands.focus();
				}, 100);
			}
		}
	});

	function setupAllImages() {
		if (!element) return;
		
		const images = element.querySelectorAll('img:not([data-resize-setup])');
		images.forEach(img => {
			setupSingleImage(img as HTMLImageElement);
		});
	}

	function setupSingleImage(img: HTMLImageElement) {
		if (img.getAttribute('data-resize-setup')) return;
		
		img.setAttribute('data-resize-setup', 'true');
		img.classList.add('resizable-image');
		
		// Add click handler
		img.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			selectImage(img);
		});
		
		// Add resize handles on hover
		img.addEventListener('mouseenter', () => {
			if (!img.parentElement?.classList.contains('image-resize-wrapper')) {
				wrapImageWithResizer(img);
			}
		});
	}

	function wrapImageWithResizer(img: HTMLImageElement) {
		// Don't wrap if already wrapped
		if (img.parentElement?.classList.contains('image-resize-wrapper')) return;
		
		const wrapper = document.createElement('div');
		wrapper.className = 'image-resize-wrapper';
		wrapper.style.cssText = 'position: relative; display: inline-block; max-width: 100%;';
		
		// Insert wrapper before image and move image into it
		img.parentNode?.insertBefore(wrapper, img);
		wrapper.appendChild(img);
		
		// Create resize handles
		const positions = ['nw', 'ne', 'sw', 'se'];
		positions.forEach(pos => {
			const handle = document.createElement('div');
			handle.className = `resize-handle ${pos}`;
			handle.style.cssText = `
				position: absolute;
				width: 12px;
				height: 12px;
				background: #3b82f6;
				border: 2px solid white;
				border-radius: 50%;
				cursor: ${pos}-resize;
				z-index: 50;
				opacity: 0;
				transition: opacity 0.2s ease;
				box-shadow: 0 2px 4px rgba(0,0,0,0.2);
			`;
			
			// Position the handle
			switch(pos) {
				case 'nw': handle.style.top = '-6px'; handle.style.left = '-6px'; break;
				case 'ne': handle.style.top = '-6px'; handle.style.right = '-6px'; break;
				case 'sw': handle.style.bottom = '-6px'; handle.style.left = '-6px'; break;
				case 'se': handle.style.bottom = '-6px'; handle.style.right = '-6px'; break;
			}
			
			// Add mousedown handler for resizing
			handle.addEventListener('mousedown', (e) => startResize(e, img, pos));
			
			wrapper.appendChild(handle);
		});
		
		// Show handles on hover
		wrapper.addEventListener('mouseenter', () => {
			wrapper.querySelectorAll('.resize-handle').forEach(handle => {
				(handle as HTMLElement).style.opacity = '1';
			});
		});
		
		wrapper.addEventListener('mouseleave', () => {
			if (!wrapper.classList.contains('selected')) {
				wrapper.querySelectorAll('.resize-handle').forEach(handle => {
					(handle as HTMLElement).style.opacity = '0';
				});
			}
		});
	}

	function selectImage(img: HTMLImageElement) {
		// Remove previous selections
		document.querySelectorAll('.image-resize-wrapper').forEach(wrapper => {
			wrapper.classList.remove('selected');
			wrapper.querySelectorAll('.resize-handle').forEach(handle => {
				(handle as HTMLElement).style.opacity = '0';
			});
		});

		// Ensure image is wrapped
		if (!img.parentElement?.classList.contains('image-resize-wrapper')) {
			wrapImageWithResizer(img);
		}

		// Select the current image
		const wrapper = img.closest('.image-resize-wrapper');
		if (wrapper) {
			wrapper.classList.add('selected');
			wrapper.querySelectorAll('.resize-handle').forEach(handle => {
				(handle as HTMLElement).style.opacity = '1';
			});
		}
	}

	function addResizeHandles(wrapper: HTMLElement, img: HTMLImageElement) {
		// This function is no longer used - handles are created in wrapImageWithResizer
	}

	function startResize(e: MouseEvent, img: HTMLImageElement, handle: string) {
		e.preventDefault();
		e.stopPropagation();

		const startX = e.clientX;
		const startY = e.clientY;
		const startWidth = img.offsetWidth;
		const startHeight = img.offsetHeight;
		const aspectRatio = startWidth / startHeight;

		function handleMouseMove(e: MouseEvent) {
			let newWidth = startWidth;
			let newHeight = startHeight;

			switch (handle) {
				case 'se':
					newWidth = startWidth + (e.clientX - startX);
					newHeight = newWidth / aspectRatio;
					break;
				case 'sw':
					newWidth = startWidth - (e.clientX - startX);
					newHeight = newWidth / aspectRatio;
					break;
				case 'ne':
					newWidth = startWidth + (e.clientX - startX);
					newHeight = newWidth / aspectRatio;
					break;
				case 'nw':
					newWidth = startWidth - (e.clientX - startX);
					newHeight = newWidth / aspectRatio;
					break;
			}

			// Set minimum and maximum sizes
			newWidth = Math.max(50, Math.min(800, newWidth));
			newHeight = newWidth / aspectRatio;

			img.style.width = `${newWidth}px`;
			img.style.height = `${newHeight}px`;

			// Update the image attributes in the editor
			if (editor) {
				const { view } = editor;
				const pos = view.posAtDOM(img, 0);
				if (pos !== null) {
					const tr = view.state.tr.setNodeMarkup(pos, null, {
						...img.attributes,
						width: newWidth,
						height: newHeight,
					});
					view.dispatch(tr);
				}
			}
		}

		function handleMouseUp() {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		}

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function setupImageResize() {
		// Click outside to deselect images
		document.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.image-resize-wrapper') && !target.closest('img')) {
				document.querySelectorAll('.image-resize-wrapper').forEach(wrapper => {
					wrapper.classList.remove('selected');
					wrapper.querySelectorAll('.resize-handle').forEach(handle => {
						(handle as HTMLElement).style.opacity = '0';
					});
				});
			}
		});
	}

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	// Update editor content when active note changes
	$effect(() => {
		if (editor && $activeNote) {
			const currentContent = editor.getHTML();
			const newContent = $activeNote.content || '';
			
			if (currentContent !== newContent) {
				editor.commands.setContent(newContent, false);
				// Set up images after content is loaded
				setTimeout(() => {
					setupAllImages();
				}, 100);
			}
		}
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
			gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
			
			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.08);
		} catch (error) {
			// Silently fail if audio context is not available
		}
	}

	// Export methods for toolbar actions
	export function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	export function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	export function toggleStrike() {
		editor?.chain().focus().toggleStrike().run();
	}

	export function toggleCode() {
		editor?.chain().focus().toggleCode().run();
	}

	export function setHeading(level: 1 | 2 | 3 | 0) {
		console.log('setHeading called with level:', level);
		if (level === 0) {
			console.log('Setting paragraph');
			editor?.chain().focus().setParagraph().run();
		} else {
			console.log('Setting heading level:', level);
			editor?.chain().focus().setHeading({ level }).run();
		}
	}

	export function toggleLink() {
		// This will be handled by the popover in the toolbar
		return;
	}

	export function setLink(url: string) {
		if (!url) {
			editor?.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}

		const { from, to, empty } = editor?.state.selection || { from: 0, to: 0, empty: true };
		
		if (empty) {
			// No text selected - insert link text and make it a link
			const linkText = url.replace(/^https?:\/\//, '').replace(/\/$/, ''); // Clean URL for display
			editor?.chain()
				.focus()
				.insertContent(`<a href="${url}">${linkText}</a>&nbsp;`)
				.setTextSelection(to + linkText.length + 1) // Position cursor after the link and space
				.run();
		} else {
			// Text is selected - convert selection to link
			editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
			// Move cursor to end of the link and add a space
			const currentPos = editor?.state.selection.to || 0;
			editor?.chain()
				.focus()
				.setTextSelection(currentPos)
				.insertContent(' ')
				.run();
		}
	}

	export function addImage() {
		// This will be handled by the popover in the toolbar
		return;
	}

	export function insertImage(url: string, alt?: string) {
		if (url) {
			editor?.chain().focus().setImage({ 
				src: url, 
				alt: alt || '',
				class: 'max-w-full h-auto rounded-lg resizable-image'
			}).run();
			
			// Set up the new image after a short delay
			setTimeout(() => {
				const newImages = element.querySelectorAll('img:not([data-resize-setup])');
				newImages.forEach(img => {
					setupSingleImage(img as HTMLImageElement);
				});
			}, 100);
		}
	}

	export function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	export function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	export function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	export function undo() {
		editor?.chain().focus().undo().run();
	}

	export function redo() {
		editor?.chain().focus().redo().run();
	}

	export function getContent() {
		return editor?.getHTML() || '';
	}

	export function getTextContent() {
		return editor?.getText() || '';
	}

	export function getCurrentHeadingLevel(): 0 | 1 | 2 | 3 {
		if (!editor) return 0;
		
		const { from, to } = editor.state.selection;
		const node = editor.state.doc.nodeAt(from);
		
		if (node && node.type.name === 'heading') {
			return node.attrs.level as 1 | 2 | 3;
		}
		
		// Check if we're inside a heading node
		const resolvedFrom = editor.state.doc.resolve(from);
		for (let depth = resolvedFrom.depth; depth > 0; depth--) {
			const ancestor = resolvedFrom.node(depth);
			if (ancestor.type.name === 'heading') {
				return ancestor.attrs.level as 1 | 2 | 3;
			}
		}
		
		return 0; // paragraph
	}

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div class="flex-1 w-full max-w-4xl mx-auto p-3 md:p-6 pt-12 md:pt-16">
	<!-- TipTap Editor -->
	<div bind:this={element} class="min-h-[70vh] md:min-h-[80vh] touch-manipulation"></div>
</div>

<style>
	:global(.ProseMirror) {
		outline: none;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		line-height: 1.6;
		color: hsl(var(--foreground));
		background: transparent;
		padding: 0;
		border: none;
		/* Mobile input improvements */
		-webkit-touch-callout: text;
		-webkit-user-select: text;
		-khtml-user-select: text;
		-moz-user-select: text;
		-ms-user-select: text;
		user-select: text;
		touch-action: manipulation;
		/* Prevent zoom on input focus for mobile */
		font-size: 16px;
	}

	/* Mobile-specific adjustments */
	@media (max-width: 768px) {
		:global(.ProseMirror) {
			font-size: 16px !important; /* Prevent zoom on iOS */
			min-height: 60vh;
			/* Ensure touch events work properly */
			cursor: text;
			-webkit-tap-highlight-color: transparent;
		}
		
		:global(.ProseMirror p) {
			font-size: 16px;
			line-height: 1.5;
			min-height: 1.5em; /* Ensure touch targets */
		}
		
		:global(.ProseMirror h1) {
			font-size: 1.75rem;
		}
		
		:global(.ProseMirror h2) {
			font-size: 1.5rem;
		}
		
		:global(.ProseMirror h3) {
			font-size: 1.25rem;
		}
	}

	/* Add touch-friendly styles */
	.touch-manipulation {
		touch-action: manipulation;
		-webkit-overflow-scrolling: touch;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: hsl(var(--muted-foreground) / 0.2);
		pointer-events: none;
		height: 0;
	}

	:global(.ProseMirror ::selection) {
		background-color: hsl(var(--primary) / 0.3);
	}

	:global(.ProseMirror ::-moz-selection) {
		background-color: hsl(var(--primary) / 0.3);
	}

	/* Typography styles */
	:global(.ProseMirror h1) {
		font-size: 2.25rem;
		font-weight: 800;
		line-height: 1.2;
		margin: 1.5rem 0 1rem 0;
		color: hsl(var(--foreground));
	}

	:global(.ProseMirror h2) {
		font-size: 1.875rem;
		font-weight: 700;
		line-height: 1.3;
		margin: 1.25rem 0 0.75rem 0;
		color: hsl(var(--foreground));
	}

	:global(.ProseMirror h3) {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.4;
		margin: 1rem 0 0.5rem 0;
		color: hsl(var(--foreground));
	}

	:global(.ProseMirror p) {
		margin: 0.75rem 0;
		color: hsl(var(--foreground));
	}

	:global(.ProseMirror blockquote) {
		border-left: 4px solid hsl(var(--primary));
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: hsl(var(--muted-foreground));
	}

	:global(.ProseMirror ul, .ProseMirror ol) {
		margin: 1rem 0;
		padding-left: 2rem;
	}

	:global(.ProseMirror li) {
		margin: 0.25rem 0;
		color: hsl(var(--foreground));
	}

	:global(.ProseMirror strong) {
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	:global(.ProseMirror em) {
		font-style: italic;
		color: hsl(var(--foreground));
	}

	:global(.ProseMirror code) {
		background-color: hsl(var(--muted));
		color: hsl(var(--foreground));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.875em;
	}

	:global(.ProseMirror pre) {
		background-color: hsl(var(--muted));
		color: hsl(var(--foreground));
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.ProseMirror pre code) {
		background: none;
		padding: 0;
		font-size: inherit;
	}

	:global(.ProseMirror a) {
		color: hsl(var(--primary));
		text-decoration: underline;
		cursor: pointer;
	}

	:global(.ProseMirror a:hover) {
		text-decoration: none;
	}

	:global(.ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 2px solid transparent;
	}

	:global(.ProseMirror img:hover) {
		transform: scale(1.02);
		border-color: hsl(var(--primary) / 0.3);
		box-shadow: 0 4px 12px hsl(var(--primary) / 0.2);
	}

	:global(.ProseMirror img.resizable-image) {
		position: relative;
		display: block;
	}

	:global(.ProseMirror img.selected) {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}

	/* Image resize controls - simplified since we create styles inline */
	:global(.image-resize-wrapper) {
		position: relative !important;
		display: inline-block !important;
		max-width: 100% !important;
	}

	:global(.image-resize-wrapper.selected) {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}
</style>
