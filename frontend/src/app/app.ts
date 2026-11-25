import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subscription } from 'rxjs';
import { deadlineState, displayDeadline } from './deadline';
import { TaskDialog, TaskDialogData, TaskSubmission } from './dialogs/task-dialog';
import { Server } from './server';
import { TASK_STATUSES, Task, TaskStatus } from './task';

type DeadlineWarning = 'soon' | 'overdue';
const DEADLINE_REFRESH_INTERVAL_MS = 60_000;

@Component({
	selector: 'app-root',
	imports: [DecimalPipe],
	providers: [DialogService],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
	protected readonly statuses = TASK_STATUSES;
	protected readonly tasks = signal<Task[]>([]);
	protected readonly selectedStatus = signal<TaskStatus | null>(null);
	protected readonly selectedDeadline = signal<DeadlineWarning | null>(null);
	protected readonly now = signal(Date.now());
	protected readonly displayDeadline = displayDeadline;
	protected readonly deadlineState = deadlineState;
	protected readonly error = signal('');
	protected readonly busy = signal(false);
	private readonly server = inject(Server);
	private readonly dialogService = inject(DialogService);
	private readonly destroyRef = inject(DestroyRef);
	private readonly dialogOpen = signal(false);
	private taskDialog?: DynamicDialogRef<TaskDialog>;
	private subscription?: Subscription;
	private deadlineTimer?: ReturnType<typeof setInterval>;

	protected readonly pageError = computed(() => this.dialogOpen() ? '' : this.error());

	protected readonly visibleTasks = computed(() => {
		if (this.selectedStatus())
			return this.tasks().filter((task) => task.status === this.selectedStatus());
		if (this.selectedDeadline())
			return this.tasks().filter((task) => deadlineState(task.dueAt, task.status, this.now()) === this.selectedDeadline());
		return this.tasks();
	});

	protected readonly deadlineSummary = computed(() => {
		const counts = { soon: 0, overdue: 0 };
		for (const task of this.tasks()) {
			const state = deadlineState(task.dueAt, task.status, this.now());
			if (state) counts[state]++;
		}
		return counts;
	});

	protected readonly statusSummary = computed(() => {
		const summary = this.statuses.map((status) => {
			const count = this.tasks().filter((task) => task.status === status).length;
			return { status, count, percentage: this.tasks().length ? count / this.tasks().length * 100 : 0 };
		});
		// only visible segments need rounded ends
		const nonEmpty = summary.filter((item) => item.count > 0);
		return summary.map((item) => ({
			...item,
			first: item === nonEmpty[0],
			last: item === nonEmpty[nonEmpty.length - 1],
		}));
	});

	ngOnInit(): void {
		this.deadlineTimer = setInterval(() => this.now.set(Date.now()), DEADLINE_REFRESH_INTERVAL_MS);
		this.subscription = this.server.watchTasks().subscribe((event) => {
			if (event.type === 'tasks') {
				this.tasks.set(event.tasks);
				this.now.set(Date.now());
			} else {
				this.error.set(event.message);
			}
		});
	}

	protected filterByStatus(status: TaskStatus): void {
		this.selectedDeadline.set(null);
		this.selectedStatus.update((current) => current === status ? null : status);
	}

	protected filterByDeadline(deadline: DeadlineWarning): void {
		this.selectedStatus.set(null);
		this.selectedDeadline.update((current) => current === deadline ? null : deadline);
	}

	protected openTaskDialog(task?: Task): void {
		if (this.taskDialog) return;
		this.error.set('');
		const dialog = this.dialogService.open<TaskDialog, TaskDialogData>(TaskDialog, {
			header: task ? 'Feladat szerkesztése' : 'Új feladat',
			data: { editing: task ?? null, error: this.error.asReadonly() },
			modal: true,
			closable: true,
			width: '25%',
		})!;
		this.taskDialog = dialog;
		this.dialogOpen.set(true);
		dialog.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((submission: TaskSubmission | undefined) => {
			this.dialogOpen.set(false);
			this.error.set('');
			if (submission) void this.submit(submission);
		});
		dialog.onDestroy.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
			this.taskDialog = undefined;
			this.dialogOpen.set(false);
		});
	}

	private async submit({ editing, task }: TaskSubmission): Promise<void> {
		const current = this.tasks().find((item) => item.id === editing?.id);
		if (editing && task.dueAt === (editing.dueAt ?? null) && current) {
			task.dueAt = current.dueAt ?? null;
		}
		if (editing && task.status === editing.status) {
			task.status = current?.status ?? editing.status;
		}
		await this.request(() => editing ? this.server.updateTask(editing.id, task) : this.server.createTask(task));
	}

	protected async remove(task: Task): Promise<void> {
		if (!confirm(`Biztosan törlöd ezt a feladatot: ${task.title}?`))
			return;
		await this.request(() => this.server.deleteTask(task.id));
	}

	private async request(operation: () => Promise<void>): Promise<void> {
		this.busy.set(true);
		this.error.set('');
		try {
			await operation();
		} catch (error) {
			this.error.set(error instanceof Error ? error.message : 'A művelet nem sikerült.');
		} finally {
			this.busy.set(false);
		}
	}

	ngOnDestroy(): void {
		clearInterval(this.deadlineTimer);
		this.subscription?.unsubscribe();
		this.taskDialog?.destroy();
	}
}
