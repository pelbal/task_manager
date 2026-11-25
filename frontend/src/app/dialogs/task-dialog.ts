import { formatDate, NgTemplateOutlet } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TASK_STATUSES, Task, TaskStatus } from '../task';

export interface TaskDialogData {
	editing: Task | null;
	error: Signal<string>;
}

export interface TaskSubmission {
	editing: Task | null;
	task: Omit<Task, 'id'>;
}

@Component({
	selector: 'app-task-dialog',
	imports: [ReactiveFormsModule, DatePickerModule, NgTemplateOutlet],
	templateUrl: './task-dialog.html',
	styleUrl: './task-dialog.scss',
})
export class TaskDialog {
	private readonly dialog = inject(DynamicDialogRef);
	protected readonly data: TaskDialogData;
	protected readonly statuses = TASK_STATUSES;

	protected readonly form = new FormGroup({
		title: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.pattern(/\S/)],
		}),
		description: new FormControl('', { nonNullable: true }),
		status: new FormControl<TaskStatus>('TODO', { nonNullable: true }),
		dueDate: new FormControl<Date | string | null>(null, {
			validators: ({ value }) => !value || (value instanceof Date && !Number.isNaN(value.getTime()))
				? null : { date: true },
		}),
	});

	constructor() {
		const data = inject<DynamicDialogConfig<TaskDialogData>>(DynamicDialogConfig).data;
		if (!data)
			throw new Error('A feladatdialógus adatai hiányoznak.');
		this.data = data;
		if (data.editing) {
			const task = data.editing;
			this.form.reset({
				title: task.title,
				description: task.description,
				status: task.status,
				dueDate: task.dueAt ? new Date(`${task.dueAt}T00:00:00`) : null,
			});
		}
	}

	protected close(): void {
		this.dialog.close();
	}

	protected submit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}
		const values = this.form.getRawValue();
		const title = values.title.trim();
		const dueAt = values.dueDate ? formatDate(values.dueDate, 'yyyy-MM-dd', 'en-US') : null;
		const submission: TaskSubmission = {
			editing: this.data.editing,
			task: { title, description: values.description.trim(), status: values.status, dueAt },
		};
		this.dialog.close(submission);
	}
}
