import { createApp } from './app.js';
import { createMongoClient, createTaskStore, getDatabase } from './db.js';

const client = createMongoClient();
try {
	await client.connect();
	const store = createTaskStore(getDatabase(client));
	await store.initialize();
	const { server } = createApp(store);
	server.listen(3000, '127.0.0.1', () => {
		console.log('TaskManager backend: http://127.0.0.1:3000');
	});
	server.on('error', (error) => {
		console.error('Szerver hibba:', error);
		process.exitCode = 1;
		client.close().catch((closeError) => console.error('MongoDB kapcsolata lezárult:', closeError));
	});
} catch (error) {
	await client.close();
	throw error;
}
