import {SlotResponse} from "./slot-types";

function formatLocalDate(date: Date): string {
	const year: string = String(date.getFullYear());
	const month: string = String(date.getMonth() + 1).padStart(2, "0");
	const day: string = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function getVisibleCalendarRange(): { start: string; end: string } | null {
	const days: HTMLElement[] = Array.from(
		document.querySelectorAll<HTMLElement>(".fc-day-header[data-date]"),
	);

	const dates: string[] = days
		.map((day: HTMLElement): string | undefined => day.dataset.date)
		.filter((date: string | undefined): date is string => Boolean(date))
		.sort();

	if (dates.length === 0) {
		return null;
	}

	const endDate: Date = new Date(`${dates[dates.length - 1]}T00:00:00`);
	endDate.setDate(endDate.getDate() + 1);

	return {
		start: dates[0],
		end: formatLocalDate(endDate),
	};
}

export function getSlotsUrl(): string | null {
	const calendar: HTMLElement | null =
		document.querySelector<HTMLElement>("#calendar");

	if (!calendar) {
		return null;
	}

	const indexUrl: string | undefined = calendar.dataset.indexUrl;

	if (!indexUrl) {
		return null;
	}

	const url = new URL(indexUrl, window.location.origin);
	const visibleRange = getVisibleCalendarRange();

	if (!visibleRange) {
		return url.toString();
	}

	url.searchParams.set("start", visibleRange.start);
	url.searchParams.set("end", visibleRange.end);

	return url.toString();
}

export async function fetchSlots(): Promise<SlotResponse[]> {
	const url: string | null = getSlotsUrl();

	if (!url) {
		throw new Error("Unable to find slots URL");
	}

	console.log("[42 Slot Watcher] fetching:", url);

	const response: Response = await fetch(url, {
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch slots: ${response.status}`);
	}

	return response.json() as Promise<SlotResponse[]>;
}
