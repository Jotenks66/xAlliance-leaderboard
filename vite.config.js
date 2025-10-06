import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
    preview: {
        host: true,
        strictPort: false,
        cors: true,
        allowedHosts: ['localhost', '127.0.0.1', 'leaderboard.gaupalabs.com']
		
    },
    server: {
        host: true,
        strictPort: false,
        cors: true,
        allowedHosts: ['localhost', '127.0.0.1', 'leaderboard.gaupalabs.com'],
        hmr: {
            clientPort: 5173
        }
    }
});
