<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { _ } from 'svelte-i18n';

	let sessionCode = $state('');

	function joinSession() {
		if (sessionCode.length === 6) {
			goto(`${base}/${sessionCode.toUpperCase()}`);
		}
	}
</script>

<div class="hero min-h-screen bg-base-200">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold mb-4">Jutukuva</h1>
			<p class="text-xl mb-8">
				{$_('web_viewer.tagline')}
			</p>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title justify-center">
						{$_('web_viewer.join_session')}
					</h2>

					<div class="form-control w-full">
						<label class="label">
							<span class="label-text">
								{$_('web_viewer.enter_code')}
							</span>
						</label>
						<input
							type="text"
							placeholder="ABC123"
							class="input input-bordered input-lg w-full text-center font-mono text-2xl uppercase"
							maxlength="6"
							bind:value={sessionCode}
							oninput={(e) => {
								sessionCode = e.currentTarget.value.toUpperCase();
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' && sessionCode.length === 6) {
									joinSession();
								}
							}}
						/>
					</div>

					<div class="card-actions justify-center mt-4">
						<button
							class="btn btn-primary btn-lg"
							disabled={sessionCode.length !== 6}
							onclick={joinSession}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/>
							</svg>
							{$_('web_viewer.join')}
						</button>
					</div>
				</div>
			</div>

			<div class="mt-8 text-sm text-base-content/60">
				<p>
					{$_('web_viewer.web_viewer_note')}
				</p>
			</div>
		</div>
	</div>
</div>
