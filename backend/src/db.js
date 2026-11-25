import { MongoClient } from 'mongodb';

export function createMongoClient() {
	return new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
}

export function getDatabase(client) {
	return client.db(process.env.MONGODB_DB || 'task');
}

export function createTaskStore(db) {
	const tasks = db.collection('tasks');
	const strip = ({ _id, ...task }) => task;

	return {
		async initialize() {
			await tasks.createIndex({ id: 1 }, { unique: true });
		},
		async list() {
			return (await tasks.find().toArray()).map((doc) => ({ dueAt: null, ...strip(doc) }));
		},
		async create(task) {
			await tasks.insertOne({ ...task });
		},
		async update(task) {
			const result = await tasks.replaceOne({ id: task.id }, task);
			return result.matchedCount > 0;
		},
		async remove(id) {
			const result = await tasks.deleteOne({ id });
			return result.deletedCount > 0;
		}
	};
}
