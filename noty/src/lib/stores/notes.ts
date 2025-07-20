import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface Note {
	id: string;
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

function createNotesStore() {
	const { subscribe, set, update } = writable<Note[]>([]);
	const {
		subscribe: activeSubscribe,
		set: setActive,
		update: updateActive
	} = writable<string | null>(null);

	let saveTimeout: ReturnType<typeof setTimeout>;

	return {
		subscribe,
		activeNoteId: { subscribe: activeSubscribe },

		init: () => {
			if (browser) {
				const stored = localStorage.getItem('noty-notes');
				const activeStored = localStorage.getItem('noty-active-note');

				if (stored) {
					const notes = JSON.parse(stored).map((note: any) => ({
						...note,
						createdAt: new Date(note.createdAt),
						updatedAt: new Date(note.updatedAt)
					}));
					set(notes);
				}

				if (activeStored) {
					setActive(activeStored);
				} else if (stored && JSON.parse(stored).length > 0) {
					// Set first note as active if no active note is stored
					setActive(JSON.parse(stored)[0].id);
				}
			}
		},

		createNote: (title?: string) => {
			console.log('Creating new note with title:', title);
			const newNote: Note = {
				id: crypto?.randomUUID
					? crypto.randomUUID()
					: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				title: title || 'Untitled',
				content: '',
				createdAt: new Date(),
				updatedAt: new Date()
			};
			console.log('New note created:', newNote);

			update((notes) => {
				const updatedNotes = [newNote, ...notes];
				console.log('Updated notes array:', updatedNotes);
				if (browser) {
					localStorage.setItem('noty-notes', JSON.stringify(updatedNotes));
				}
				return updatedNotes;
			});

			setActive(newNote.id);
			if (browser) {
				localStorage.setItem('noty-active-note', newNote.id);
			}
			console.log('New note set as active:', newNote.id);

			return newNote.id;
		},

		deleteNote: (id: string) => {
			update((notes) => {
				const updatedNotes = notes.filter((note) => note.id !== id);
				if (browser) {
					localStorage.setItem('noty-notes', JSON.stringify(updatedNotes));
				}

				// If deleting active note, set another as active
				activeSubscribe((activeId) => {
					if (activeId === id) {
						const newActive = updatedNotes.length > 0 ? updatedNotes[0].id : null;
						setActive(newActive);
						if (browser) {
							if (newActive) {
								localStorage.setItem('noty-active-note', newActive);
							} else {
								localStorage.removeItem('noty-active-note');
							}
						}
					}
					return activeId;
				});

				return updatedNotes;
			});
		},

		setActiveNote: (id: string) => {
			setActive(id);
			if (browser) {
				localStorage.setItem('noty-active-note', id);
			}
		},

		updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
			update((notes) => {
				const updatedNotes = notes.map((note) =>
					note.id === id
						? {
								...note,
								...updates,
								updatedAt: new Date(),
								// Auto-generate title from content if not provided
								title:
									updates.title ||
									generateTitleFromContent(updates.content || note.content) ||
									note.title
							}
						: note
				);

				// Auto-save with debounce
				if (browser) {
					clearTimeout(saveTimeout);
					saveTimeout = setTimeout(() => {
						localStorage.setItem('noty-notes', JSON.stringify(updatedNotes));
					}, 500);
				}

				return updatedNotes;
			});
		},

		renameNote: (id: string, title: string) => {
			update((notes) => {
				const updatedNotes = notes.map((note) =>
					note.id === id ? { ...note, title, updatedAt: new Date() } : note
				);

				if (browser) {
					localStorage.setItem('noty-notes', JSON.stringify(updatedNotes));
				}

				return updatedNotes;
			});
		}
	};
}

function generateTitleFromContent(content: string): string {
	if (!content.trim()) return 'Untitled';

	// Remove HTML tags and get plain text content
	const textContent = content.replace(/<[^>]*>/g, '').trim();

	if (!textContent) return 'Untitled';

	// Extract first line and limit length
	const firstLine = textContent.split('\n')[0].trim();

	return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine || 'Untitled';
}

export const notesStore = createNotesStore();

// Derived store for active note
export const activeNote = derived(
	[notesStore, notesStore.activeNoteId],
	([notes, activeId]) => notes.find((note) => note.id === activeId) || null
);
