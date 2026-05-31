console.log("[42 Slot Watcher] loaded");

function formatLocalDate(date: Date): string {
	const year: string = String(date.getFullYear());
	const month: string = String(date.getMonth() + 1).padStart(2, "0");
	const day: string = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function getVisibleCalendarRange(): { start: string; end: string } | null {
	const days: Array<HTMLElement> = Array.from(
		document.querySelectorAll("[data-date]")
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

function getSlotsUrl(): string | null {
	const calendar: HTMLElement | null = document.querySelector("#calendar");

	if (!calendar) {
		return null;
	}

	const indexUrl: string | undefined = calendar.dataset.indexUrl;

	if (!indexUrl) {
		return null;
	}

	const url = new URL(indexUrl, window.location.origin);

	const visibleRange: { start: string, end: string } | null = getVisibleCalendarRange();

	if (!visibleRange)
		return url.toString();

	const start: string | null = visibleRange.start ?? new Date().toISOString().split('T')[0];
	const end: string | null = visibleRange.end ?? new Date().toISOString().split('T')[0];

	url.searchParams.set("start", start);
	url.searchParams.set("end", end);

	return url.toString();
}

async function fetchSlots(): Promise<any> {
	const url: string | null = getSlotsUrl();

	if (!url)
		throw new Error("Unable to find slots URL");

	const response: Response = await fetch(url, {
		credentials: "include",
	});

	if (!response.ok)
		throw new Error(`Failed to fetch slots: ${response.status}`);

	return response.json();
}

console.log(fetchSlots());
