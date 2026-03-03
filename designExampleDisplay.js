<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { DisplaySettings } from '$lib/types/display-settings';

	interface Props {
		text: string;
		settings: DisplaySettings;
		lastUpdated: number | null;
	}

	let {
		text,
		settings,
		lastUpdated
	}: Props = $props();

	const placeholder = $derived($_('subtitle.waiting'));

	// Split text into paragraphs for proper spacing
	const paragraphs = $derived.by(() => {
		const trimmed = text.trim();
		if (!trimmed) return [placeholder];

		if (settings.viewMode === 'captions') {
			// Show only the last 3 lines
			const lines = trimmed.split('\n');
			if (lines.length <= 3) return lines;
			return lines.slice(-3);
		}

		return trimmed.split('\n');
	});

	const shellStyle = $derived(
		`color: ${settings.textColor}; ` +
			`font-size: ${settings.fontSize}px; ` +
			`font-weight: ${settings.fontWeight}; ` +
			`letter-spacing: ${settings.letterSpacing}em;`
	);
</script>

<section
	class="subtitle-shell {settings.horizontalAlignment === 'full' ? 'full' : ''}"
	style={shellStyle}
	aria-live="polite"
>
	{#each paragraphs as paragraph}
		<p class="subtitle-text">{paragraph}</p>
	{/each}
</section>

<style>
	.subtitle-text {
		margin: 0 0 0.6em 0;
	}

	.subtitle-text:last-child {
		margin-bottom: 0;
	}
</style>
