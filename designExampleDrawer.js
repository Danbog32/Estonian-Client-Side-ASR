<script lang="ts">
	import { browser } from '$app/environment';
	import { _ } from 'svelte-i18n';
	import type { DisplaySettings } from '$lib/types/display-settings';
	import AlignmentIcons from './AlignmentIcons.svelte';

	interface Props {
		open: boolean;
		settings: DisplaySettings;
		onClose: () => void;
		onChange: (nextSettings: DisplaySettings) => void;
		onReset?: () => void;
	}

	let { open, settings, onClose, onChange, onReset }: Props = $props();

	// Detect mobile device using media query
	let isMobile = $state(false);

	$effect(() => {
		if (!browser) return;

		const checkMobile = () => {
			isMobile = window.matchMedia('(max-width: 768px)').matches;
		};

		checkMobile();
		const mediaQuery = window.matchMedia('(max-width: 768px)');
		mediaQuery.addEventListener('change', checkMobile);

		return () => mediaQuery.removeEventListener('change', checkMobile);
	});

	const fontSizeMin = $derived(isMobile ? 16 : 48);
	const fontSizeMax = $derived(isMobile ? 72 : 96);
	const fontSizeStep = $derived(isMobile ? 2 : 2);

	const fontWeightOptions = $derived([
		{ label: $_('settings.font_weight_regular'), value: 400 as const, description: $_('settings.font_weight_regular_desc') },
		{ label: $_('settings.font_weight_semibold'), value: 600 as const, description: $_('settings.font_weight_semibold_desc') }
	]);

	const colorPresets = $derived([
		{ label: $_('settings.preset_black_on_white'), textColor: '#000000', backgroundColor: '#FFFFFF' },
		{ label: $_('settings.preset_white_on_black'), textColor: '#FFFFFF', backgroundColor: '#000000' },
		{ label: $_('settings.preset_yellow_on_black'), textColor: '#F8E71C', backgroundColor: '#000000' },
		{ label: $_('settings.preset_cyan_on_dark'), textColor: '#50E3C2', backgroundColor: '#0B0B0B' },
		{ label: $_('settings.preset_amber_on_charcoal'), textColor: '#FFB347', backgroundColor: '#1A1A1A' },
		{ label: $_('settings.preset_blue_on_graphite'), textColor: '#E0F0FF', backgroundColor: '#0F1216' }
	]);

	const alignmentOptions = $derived([
		{ value: 'full' as const, description: $_('settings.align_full') },
		{ value: 'left' as const, description: $_('settings.align_left') },
		{ value: 'middle' as const, description: $_('settings.align_middle') },
		{ value: 'right' as const, description: $_('settings.align_right') }
	]);

	function handleSettingChange<K extends keyof DisplaySettings>(
		key: K,
		value: DisplaySettings[K]
	) {
		onChange({ ...settings, [key]: value });
	}

	function handlePresetApply(textColor: string, backgroundColor: string) {
		onChange({ ...settings, textColor, backgroundColor });
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>



{#if open}

	<div
		class="drawer-backdrop"
		onclick={onClose}
		onkeydown={handleBackdropKeydown}
		tabindex="-1"
		aria-hidden="true"
	></div>
{/if}

<div
	class="settings-drawer {open ? 'open' : ''}"
	role="dialog"
	aria-modal="true"
	aria-label={$_('settings.title')}
	tabindex="-1"
	onclick={(e) => e.stopPropagation()}
	onkeydown={(e) => e.stopPropagation()}
>
	<div class="drawer-header">
		<div class="header-content">
			<span class="drawer-title">{$_('settings.title')}</span>
			<span class="drawer-subtitle">{$_('settings.subtitle')}</span>
		</div>
		<button type="button" class="close-button" onclick={onClose} aria-label={$_('settings.close')}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
				/>
			</svg>
		</button>
	</div>

	<div class="drawer-body">
		<!-- Typography Section -->
		<section class="drawer-section">
			<div class="control-group">
				<label class="slider-control" for="font-size-slider">
					<div class="slider-header">
						<span class="control-label">{$_('settings.font_size')}</span>
						<span class="value-badge">{settings.fontSize}px</span>
					</div>
					<input
						id="font-size-slider"
						type="range"
						min={fontSizeMin}
						max={fontSizeMax}
						step={fontSizeStep}
						value={settings.fontSize}
						oninput={(event) =>
							handleSettingChange('fontSize', Number(event.currentTarget.value))}
					/>
					<div class="slider-labels">
						<span>{fontSizeMin}px</span>
						<span>{fontSizeMax}px</span>
					</div>
				</label>

				<div class="control-subsection">
					<span class="control-label">{$_('settings.font_weight')}</span>
					<div class="button-group" role="group" aria-label={$_('settings.font_weight')}>
						{#each fontWeightOptions as option (option.value)}
							<button
								type="button"
								class="option-button {settings.fontWeight === option.value ? 'active' : ''}"
								aria-pressed={settings.fontWeight === option.value}
								onclick={() => handleSettingChange('fontWeight', option.value)}
							>
								<span class="option-label">{option.label}</span>
								<span class="option-description">{option.description}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<div class="section-divider"></div>

		<!-- Colors Section -->
		<section class="drawer-section">
			<div class="section-header">
				<div class="section-icon">🎨</div>
				<div>
					<h2 class="section-title">{$_('settings.colors')}</h2>
					<p class="section-description">{$_('settings.colors_desc')}</p>
				</div>
			</div>

			<div class="control-group">
				<div class="color-pickers">
					<label class="color-picker-item" aria-label={$_('settings.text_color')}>
						<span class="color-picker-label">{$_('settings.text_color')}</span>
						<div class="color-swatch" style="background-color: {settings.textColor};">
							<input
								type="color"
								value={settings.textColor}
								oninput={(event) => handleSettingChange('textColor', event.currentTarget.value)}
							/>
						</div>
						<span class="color-value">{settings.textColor}</span>
					</label>

					<label class="color-picker-item" aria-label={$_('settings.background_color')}>
						<span class="color-picker-label">{$_('settings.background_color')}</span>
						<div class="color-swatch" style="background-color: {settings.backgroundColor};">
							<input
								type="color"
								value={settings.backgroundColor}
								oninput={(event) =>
									handleSettingChange('backgroundColor', event.currentTarget.value)}
							/>
						</div>
						<span class="color-value">{settings.backgroundColor}</span>
					</label>
				</div>

				<div class="control-subsection">
					<span class="control-label">{$_('settings.presets')}</span>
					<div class="color-presets">
						{#each colorPresets as preset (preset.label)}
							<button
								type="button"
								class="color-preset-card"
								onclick={() => handlePresetApply(preset.textColor, preset.backgroundColor)}
								aria-label={preset.label}
							>
								<div
									class="preset-preview"
									style="background-color: {preset.backgroundColor}; color: {preset.textColor};"
								>
									<span class="preset-preview-text">Aa</span>
								</div>
								<span class="preset-label">{preset.label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<div class="section-divider"></div>

		<!-- Layout Section -->
		<section class="drawer-section">
			<div class="section-header">
				<div class="section-icon">⚙️</div>
				<div>
					<h2 class="section-title">{$_('settings.layout')}</h2>
					<p class="section-description">{$_('settings.layout_desc')}</p>
				</div>
			</div>

			<div class="control-group">
				<div class="control-subsection">
					<span class="control-label">{$_('settings.horizontal_alignment')}</span>
					<div class="alignment-grid" role="group" aria-label={$_('settings.horizontal_alignment')}>
						{#each alignmentOptions as option (option.value)}
							<button
								type="button"
								class="alignment-button {settings.horizontalAlignment === option.value
									? 'active'
									: ''}"
								aria-pressed={settings.horizontalAlignment === option.value}
								onclick={() => handleSettingChange('horizontalAlignment', option.value)}
							>
								<span class="alignment-icon">
									<AlignmentIcons type={option.value} />
								</span>
								<span class="alignment-description">{option.description}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
		</section>

		{#if onReset}
			<button type="button" class="reset-button" onclick={onReset}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
					/>
				</svg>
				{$_('settings.reset')}
			</button>
		{/if}
	</div>
</div>
