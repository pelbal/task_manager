import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Task } from './task';

export type TaskEvent =
	| { type: 'tasks'; tasks: Task[] }
	| { type: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class Server {
	watchTasks(): Observable<TaskEvent> {
		return new Observable<TaskEvent>((subscriber) => {
			let socket: WebSocket;
			let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

			const connect = () => {
				const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
				const currentSocket = new WebSocket(`${protocol}//${location.host}/ws`);
				socket = currentSocket;
				currentSocket.onmessage = (event: MessageEvent<string>) => {
					let message: { type?: string; tasks?: Task[] };
					try {
						message = JSON.parse(event.data);
					} catch {
						subscriber.next({ type: 'error', message: 'Nem sikerült feldolgozni a szerver üzenetét' });
						return;
					}
					if (message?.type !== 'tasks' || !Array.isArray(message.tasks)) {
						subscriber.next({ type: 'error', message: 'Nem sikerült feldolgozni a szerver üzenetét' });
						return;
					}
					subscriber.next({ type: 'tasks', tasks: message.tasks });
				};
				currentSocket.onerror = () => currentSocket.close();
				currentSocket.onclose = () => {
					if (subscriber.closed) return;
					reconnectTimer = setTimeout(connect, 2000);
				};
			};

			connect();
			return () => {
				clearTimeout(reconnectTimer);
				socket.close();
			};
		});
	}

	createTask(task: Omit<Task, 'id'>): Promise<void> {
		return this.request('/api/tasks', 'POST', task);
	}

	updateTask(id: string, task: Omit<Task, 'id'>): Promise<void> {
		return this.request(`/api/tasks/${encodeURIComponent(id)}`, 'PUT', task);
	}

	deleteTask(id: string): Promise<void> {
		return this.request(`/api/tasks/${encodeURIComponent(id)}`, 'DELETE');
	}

	private async request(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: Omit<Task, 'id'>): Promise<void> {
		const response = await fetch(url, {
			method,
			headers: body ? { 'Content-Type': 'application/json' } : {},
			body: body ? JSON.stringify(body) : undefined,
		});
		if (!response.ok) {
			const result: { error?: string } = await response.json();
			throw new Error(result.error || `HTTP ${response.status}`);
		}
	}
}
