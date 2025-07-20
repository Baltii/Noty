import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface ResizableImageOptions {
	HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		resizableImage: {
			setResizableImage: (options: {
				src: string;
				alt?: string;
				width?: number;
				height?: number;
			}) => ReturnType;
		};
	}
}

export const ResizableImage = Node.create<ResizableImageOptions>({
	name: 'resizableImage',

	addOptions() {
		return {
			HTMLAttributes: {}
		};
	},

	inline: false,
	group: 'block',
	draggable: true,

	addAttributes() {
		return {
			src: {
				default: null
			},
			alt: {
				default: null
			},
			title: {
				default: null
			},
			width: {
				default: null
			},
			height: {
				default: null
			}
		};
	},

	parseHTML() {
		return [
			{
				tag: 'img[src]',
				getAttrs: (element) => {
					const img = element as HTMLImageElement;
					return {
						src: img.getAttribute('src'),
						alt: img.getAttribute('alt'),
						title: img.getAttribute('title'),
						width: img.getAttribute('width') ? parseInt(img.getAttribute('width')!) : null,
						height: img.getAttribute('height') ? parseInt(img.getAttribute('height')!) : null
					};
				}
			}
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['img', { ...this.options.HTMLAttributes, ...HTMLAttributes }];
	},

	addCommands() {
		return {
			setResizableImage:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: options
					});
				}
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('resizableImage'),
				props: {
					decorations: (state) => {
						const decorations: Decoration[] = [];
						const { doc, selection } = state;

						doc.descendants((node, pos) => {
							if (node.type.name === 'resizableImage') {
								const isSelected = selection.from <= pos && selection.to >= pos + node.nodeSize;

								if (isSelected) {
									decorations.push(
										Decoration.widget(pos + 1, () => {
											const container = document.createElement('div');
											container.className = 'image-resize-container';
											container.style.cssText = `
                        position: absolute;
                        border: 2px solid hsl(var(--primary));
                        border-radius: 4px;
                        pointer-events: none;
                        z-index: 10;
                      `;

											// Add resize handles
											const handles = ['nw', 'ne', 'sw', 'se'];
											handles.forEach((handle) => {
												const handleElement = document.createElement('div');
												handleElement.className = `resize-handle resize-handle-${handle}`;
												handleElement.style.cssText = `
                          position: absolute;
                          width: 8px;
                          height: 8px;
                          background: hsl(var(--primary));
                          border: 1px solid white;
                          border-radius: 50%;
                          cursor: ${handle}-resize;
                          pointer-events: auto;
                        `;

												// Position handles
												switch (handle) {
													case 'nw':
														handleElement.style.top = '-4px';
														handleElement.style.left = '-4px';
														break;
													case 'ne':
														handleElement.style.top = '-4px';
														handleElement.style.right = '-4px';
														break;
													case 'sw':
														handleElement.style.bottom = '-4px';
														handleElement.style.left = '-4px';
														break;
													case 'se':
														handleElement.style.bottom = '-4px';
														handleElement.style.right = '-4px';
														break;
												}

												container.appendChild(handleElement);
											});

											return container;
										})
									);
								}
							}
						});

						return DecorationSet.create(doc, decorations);
					}
				}
			})
		];
	}
});
