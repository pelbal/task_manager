import { formatDate } from '@angular/common';

export function deadlineState(value: string | null | undefined, status: string, now: number): 'soon' | 'overdue' | null {
	if (!value || status === 'DONE')
		return null;
	const today = formatDate(now, 'yyyy-MM-dd', 'en-US');
	if (value < today)
		return 'overdue';
	return value === today ? 'soon' : null;
}
