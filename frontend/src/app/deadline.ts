function validDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
		return false;
	// use a utc round trip to reject nonexistent dates without local time shifts
	const time = Date.parse(`${value}T00:00:00.000Z`);
	return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function parseDateInput(value: string): string | null {
	const match = /^(\d{4})\. (\d{2})\. (\d{2})\.$/.exec(value);
	if (!match)
		return null;
	// convert the input to a sortable year-month-day format
	const date = `${match[1]}-${match[2]}-${match[3]}`;
	return validDate(date) ? date : null;
}

export function displayDeadline(value: string): string {
	return `${value.slice(0, 4)}. ${value.slice(5, 7)}. ${value.slice(8, 10)}.`;
}

export function deadlineState(value: string | null | undefined, status: string, now: number): 'soon' | 'overdue' | null {
	if (!value || status === 'DONE')
		return null;
	// compare the deadline with the device's local calendar day
	const date = new Date(now);
	const today = `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
	if (value < today)
		return 'overdue';
	return value === today ? 'soon' : null;
}
