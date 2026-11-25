import { Component, inject, Signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { displayDeadline, parseDateInput } from '../deadline';
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
	imports: [ReactiveFormsModule, DatePickerModule],
	templateUrl: './task-dialog.html',
	styleUrl: './task-dialog.scss',
})
export class TaskDialog {
	private readonly dialog = inject(DynamicDialogRef);
	protected readonly data: TaskDialogData;
	protected readonly statuses = TASK_STATUSES;

	protected readonly form = new FormGroup({
		title: new FormControl('', { nonNullable: true }),
		description: new FormControl('', { nonNullable: true }),
		status: new FormControl<TaskStatus>('TODO', { nonNullable: true }),
		dueDate: new FormControl<string | null>(''),
	});
	protected validationError = '';

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
				dueDate: task.dueAt ? displayDeadline(task.dueAt) : '',
			});
		}
	}

	protected close(): void {
		this.dialog.close();
	}

	protected changeDateInput(event: Event): void {
		if (event.target instanceof HTMLInputElement) {
			this.form.controls.dueDate.setValue(event.target.value, { emitModelToViewChange: false });
		}
	}

	protected submit(): void {
		const values = this.form.getRawValue();
		const title = values.title.trim();
		if (!title) {
			this.validationError = 'Add meg a feladat címét.';
			return;
		}
		let dueAt: string | null = null;
		const dateInput = (values.dueDate ?? '').trim();
		if (dateInput) {
			const date = parseDateInput(dateInput);
			if (!date) {
				this.validationError = 'Add meg a dátumot ÉÉÉÉ. HH. NN. formátumban.';
				return;
			}
			dueAt = date;
		}
		this.validationError = '';
		const submission: TaskSubmission = {
			editing: this.data.editing,
			task: { title, description: values.description.trim(), status: values.status, dueAt },
		};
		this.dialog.close(submission);
	}
}
