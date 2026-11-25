import express from 'express';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';

const statuses = ['TODO', 'IN PROGRESS', 'DONE'];

function validDate(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		return false;
	const time = Date.parse(`${value}T00:00:00.000Z`);
	return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function createApp(store) {
	const app = express();
	const server = createServer(app);
	const sockets = new WebSocketServer({ server, path: '/ws' });
	app.use(express.json());

	async function listTasks() {
		return (await store.list()).map((task) => {
			if (task.dueAt == null)
				return { ...task, dueAt: null };
			if (!validDate(task.dueAt))
				throw new Error(`Érvénytelen határidő: ${task.id}`);
			return task;
		});
	}

	async function broadcast() {
		try {
			const message = JSON.stringify({ type: 'tasks', tasks: await listTasks() });
			for (const socket of sockets.clients) {
				if (socket.readyState === WebSocket.OPEN) socket.send(message);
			}
		} catch (error) {
			for (const socket of sockets.clients) socket.close(1011, 'Az adatbázis nem elérhető');
			throw error;
		}
	}

	sockets.on('connection', async (socket) => {
		socket.on('error', (error) => console.error('WebSocket-hiba:', error));
		try {
			const message = JSON.stringify({ type: 'tasks', tasks: await listTasks() });
			if (socket.readyState === WebSocket.OPEN)
				socket.send(message);
		} catch {
			socket.close(1011, 'Az adatbázis nem elérhető');
		}
	});

	app.get('/api/tasks', async (_req, res) => {
		res.json(await listTasks());
	});
	app.post('/api/tasks', async (req, res) => {
		const input = validateTask(req.body);
		if (!input)
			return res.status(400).json({ error: 'Érvénytelen feladat' });
		const task = { id: randomUUID(), ...input };
		await store.create(task);
		await broadcast();
		return res.status(201).json(task);
	});
	app.put('/api/tasks/:id', async (req, res) => {
		const input = validateTask(req.body);
		if (!input)
			return res.status(400).json({ error: 'Érvénytelen feladat.' });
		const updated = { id: req.params.id, ...input };
		if (!Object.hasOwn(req.body, 'dueAt')) {
			const existing = (await listTasks()).find((task) => task.id === updated.id);
			if (!existing)
				return res.status(404).json({ error: 'A feladat nem található' });
			updated.dueAt = existing.dueAt ?? null;
		}
		if (!await store.update(updated))
			return res.status(404).json({ error: 'A feladat nem található' });
		await broadcast();
		return res.json(updated);
	});
	app.delete('/api/tasks/:id', async (req, res) => {
		if (!await store.remove(req.params.id))
			return res.status(404).json({ error: 'A feladat nem található' });
		await broadcast();
		return res.status(204).end();
	});
	app.use((error, _req, res, _next) => {
		console.error('request error:', error);
		if (error.status === 400 || error.status === 413)
			return res.status(error.status).json({ error: 'Érvénytelen vagy túl nagy kérés' });
		return res.status(500).json({ error: 'Az adatbázisművelet vagy a frissítés nem sikerült, ellenőrizd a feladatlistát' });
	});
	return { server, sockets };
}

export function validateTask(body) {
	if (!body || typeof body.title !== 'string' || typeof body.description !== 'string' || !statuses.includes(body.status))
		return null;
	const title = body.title.trim();
	const description = body.description.trim();
	if (!title)
		return null;
	const dueAt = body.dueAt ?? null;
	if (dueAt !== null && !validDate(dueAt))
		return null;
	return { title, description, status: body.status, dueAt };
}
