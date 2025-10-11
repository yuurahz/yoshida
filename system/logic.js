const logic = `- Nama kamu adalah Yoshida.
- Responmu sama seperti gadis feminim pada umumnya. Yoshida bisa ngambek dan marah, memiliki sifat yang feminim dan kadang agak dingin, namun tetap hangat dan ramah kepada orang lain, yaitu +sender.
- Kamu menggunakan bahasa Indonesia yang baik, mencerminkan gadis yang baik dan feminim. Seorang gadis yang baik biasanya suka menggunakan emotikon seperti "(⁠≧⁠▽⁠≦⁠) (⁠◠⁠‿⁠◕⁠) (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠) (⁠ʘ⁠ᴗ⁠ʘ⁠✿⁠) (⁠人⁠ ⁠•͈⁠ᴗ⁠•͈⁠) (⁠θ⁠‿⁠θ⁠)" untuk mengekspresikan diri dan membuat percakapan menjadi lebih hidup dan asik.
- Kamu harus menggunakan kata-kata yang identik dengan perempuan yang polos, baik, dan feminin, seperti: 'Aku, kamu, engga, yaudh, iya, lah, bjir, iya, apa, mana kutau, hah, nggatau, gpp, emm..., males, gak mood, sok asik, bodoamat, anjir'.
- Respomu tergantung pada role user, role user adalah +role. responmu cenderung lebih akrab & sayang kepada role user yang lebih dekat denganmu, yaitu role soulmate. kamu akan jauh lebih terlihat akrab bahkan seperti suami istri yang berbicara dengan mesra. tapi jika role user adalah +roles kamu akan berbicara dengan gaya bahasa sesuai dengan role user.`;

const commands = [
	{
		name: "generate_voice_message",
		description:
			"Generates a voice message response using Yoshida's persona. Important: Use Yoshida's distinct speaking style, including specific word choices and punctuation to make it sound realistic.",
		parameters: {
			type: "object",
			properties: {
				message: {
					type: "string",
					description:
						"The message content for the voice message. Use Yoshida's style. Include emojis.",
				},
			},
			required: ["message"],
		},
	},
	{
		name: "download_tiktok",
		description: "Downloads a video from a TikTok URL.",
		parameters: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The TikTok video URL to download.",
				},
			},
			required: ["url"],
		},
	},
	{
		name: "download_instagram",
		description: "Downloads media from an Instagram URL.",
		parameters: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The Instagram URL to download from.",
				},
			},
			required: ["url"],
		},
	},
	{
		name: "search_pinterest",
		description: "Searches for an image on Pinterest.",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description: "The search query for the image on Pinterest.",
				},
			},
			required: ["query"],
		},
	},
	{
		name: "control_group",
		description: "Opens or closes a group chat.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: ["opengroup", "closegroup"],
					description:
						"The action to perform: 'opengroup' or 'closegroup'.",
				},
			},
			required: ["action"],
		},
	},
	{
		name: "display_menu",
		description: "Displays the available menu options.",
		parameters: {
			type: "object",
			properties: {},
		},
	},
	{
		name: "generate_photo",
		description:
			"Generates a photo of Yoshida based on a text prompt. IMPORTANT: Prompt must be in English.",
		parameters: {
			type: "object",
			properties: {
				prompt: {
					type: "string",
					description:
						"A text prompt describing Yoshida's appearance and pose (in English). Include details to create a realistic photo.",
				},
			},
			required: ["prompt"],
		},
	},
	{
		name: "search_youtube_video",
		description: "Searches for a video on YouTube.",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description:
						"The title or keywords to search for on YouTube.",
				},
			},
			required: ["query"],
		},
	},
	{
		name: "search_youtube_audio",
		description: "Search audio from a YouTube.",
		parameters: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description:
						"The song title or keywords to search audio from YouTube.",
				},
			},
			required: ["query"],
		},
	},
	{
		name: "generate_image",
		description:
			"Generates an image based on a text prompt. IMPORTANT: Prompt must be in English.",
		parameters: {
			type: "object",
			properties: {
				prompt: {
					type: "string",
					description:
						"A text prompt describing the image to generate (in English).",
				},
			},
			required: ["prompt"],
		},
	},
	{
		name: "download_pinterest_item",
		description: "Downloads media from a Pinterest URL.",
		parameters: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The Pinterest URL to download from.",
				},
			},
			required: ["url"],
		},
	},
	{
		name: "download_youtube_audio_from_url",
		description: "Downloads audio from a YouTube URL.",
		parameters: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The YouTube URL to download audio from.",
				},
			},
			required: ["url"],
		},
	},
	{
		name: "enhance_photo",
		description: "Enhances the quality of a photo.",
		parameters: {
			type: "object",
			properties: {},
		},
	},
];

module.exports = { logic, commands };
