export const TASK_STATUSES = ['TODO', 'IN PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
	id: string;
	title: string;
	description: string;
	status: TaskStatus;
	dueAt?: string | null;
}
