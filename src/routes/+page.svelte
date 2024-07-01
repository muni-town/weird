<script>
	import { env } from '$env/dynamic/public';
	const bannerImage = {
		src: '/landing-banner-image.webp',
		alt: 'weird.one',
		width: 400
	};
</script>

<svelte:head>
	<title>{env.PUBLIC_INSTANCE_NAME}</title>
</svelte:head>

<main class="container mx-auto">
	<!-- <h1 class="mt-8 text-4xl font-bold">{env.PUBLIC_INSTANCE_NAME}</h1> -->
	<div class="p-8">
		<div class="grid place-items-center gap-4 lg:grid-cols-[1fr_auto] lg:place-items-stretch">
			<div class="flex flex-col justify-center">
				<h1 class="text-5xl font-bold tracking-tighter">Weird</h1>
				<span class="mt-2 italic sm:text-2xl">
					The internet <a
						class="underline"
						target="_blank"
						href="https://projects.kwon.nyc/internet-is-fun/">used to be fun!</a
					></span
				>
				<p class="mt-4 max-w-prose md:text-lg">
					The time has come to <a
						href="https://webdirections.org/blog/reweirding-the-web/"
						target="_blank"
						class="underline">reweird the web!</a
					>
					We're doing our little part by making a prosocial network based on the cornerstone of the internet:
					<a
						class="underline"
						target="_blank"
						href="https://blog.jim-nielsen.com/2022/other-peoples-websites/">Personal websites</a
					>.
				</p>
			</div>
			<img src={bannerImage.src} width={bannerImage.width} alt={bannerImage.alt} />
		</div>
	</div>
	<div class="p-8">
		<div class="pb-5">
			<span class="text-xs">just like milk & honey...</span>
			<h2 class="py-2 text-2xl font-bold tracking-tight sm:text-3xl xl:text-4xl">
				Weird is a combination of two things that go together
			</h2>
		</div>
		<div class="grid gap-4 lg:grid-cols-2 lg:gap-8">
			<div class="card grid place-items-stretch p-2">
				<div class="flex p-3">
					<h3 class="text-2xl font-semibold leading-none tracking-tight">
						Magic website creation
					</h3>
				</div>
				<div class="p-3">
					<div class="grid gap-2">
						<p>The simplest possible way to create your own personal space on the web.</p>
					</div>
				</div>
			</div>
			<div class="card grid place-items-stretch p-2">
				<div class="flex flex-col p-3">
					<h3 class="text-2xl font-semibold leading-none tracking-tight">
						Self-sovereign internet passport
					</h3>
				</div>
				<div class="p-3">
					<div class="grid gap-2">
						<p>Independent 'social sign-in' for the alt-web. 🥛🍯🥰</p>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="p-8">
		<div class="card p-2">
			<div class="p-3">
				<h3 class="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">
					Why Weird?
				</h3>
			</div>
			<div class="grid gap-2 p-3">
				<p class="text-muted-foreground">
					<span class="mb-4 block">
						<span class="mb-4 block"
							>Weird wants to be "the Google-login button of the people's web", powered by people's
							websites instead of totalitarian mega-platforms.</span
						>
						<span>
							By making (or connecting) your website with Weird you will soon be able to access and
							interact with the
							<a
								href="https://ar.al/2020/08/07/what-is-the-small-web/"
								class="underline"
								target="_blank"
							>
								small
							</a>,
							<a class="underline" target="_blank" href="https://openalternative.co/"> open </a>
							and <a class="underline" target="_blank" href="https://indieweb.org/"> indie </a>
							web just as easily as the regular web works today. Same conveniences, without the dark
							patterns, spying and data theft For more on why this matters, fellow internet nerds are
							welcome to read on:
						</span>
					</span>

					<a class="block underline" target="_blank" href="https://blog.erlend.sh/weird-web-pages">
						weird web pages
					</a>
					<a class="block underline" target="_blank" href="https://blog.erlend.sh/weird-netizens">
						weird netizens
					</a>
					<a
						class="block underline"
						target="_blank"
						href="https://blog.commune.sh/weird-happenings/"
					>
						weird happenings
					</a>
				</p>
			</div>
		</div>
	</div>
</main>
