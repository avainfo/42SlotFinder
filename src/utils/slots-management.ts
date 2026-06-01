import {SlotPattern, SlotResponse} from "./slot-types";

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

export function timeToString(time: string): { time: string, state: string } {
	const [hours, minutes] = time.split(":");
	const state = parseInt(hours) > 12;
	return {
		time: (parseInt(hours) % 12 == 0 ? 12 : parseInt(hours) % 12) + ":" + minutes,
		state: (state || hours == "12" ? " PM" : " AM")
	}
}

export function placeSlot(slot: SlotPattern): void {
	if (!slot.date)
		throw new Error("Slot date is null");

	const date: Date = new Date(Date.parse(slot.date))

	const grid: HTMLElement | null = document.querySelector(".fc-time-grid");
	if (!grid)
		throw new Error("Unable to find time grid");
	const columns: NodeListOf<HTMLElement> = grid.querySelectorAll(".fc-content-skeleton td")
	if (!columns || columns[date.getDate()] == undefined)
		throw new Error("Unable to find columns");
	const eventContainer: HTMLElement | null = columns[date.getDate()].querySelector(".fc-event-container")
	if (!eventContainer)
		throw new Error("Unable to find event container");

	const events: NodeListOf<Element> = grid.querySelectorAll('.fc-time-grid-event.fc-v-event.fc-event:not(.sf-active)');
	events.forEach((e) => e.remove())

	const pxPerMinute = grid.offsetHeight / (24 * 60);

	const startTime: { time: string, state: string } = timeToString(slot.startTime);
	const endTime: { time: string, state: string } = timeToString(slot.endTime);

	const startFullTime: string = startTime.time + " " + startTime.state;
	const endFullTime: string = endTime.time + " " + endTime.state;

	const start: number[] = slot.startTime.split(":").map(Number);
	const end: number[] = slot.endTime.split(":").map(Number);
	console.log("[42 Slot Watcher] placing slot:", start, end);

	const top: number = (start[0] * 60 + start[1]) * pxPerMinute;
	const bottom: number = (end[0] * 60 + end[1]) * pxPerMinute;

	const element = `<a class=\"sf-active fc-time-grid-event fc-v-event fc-event fc-start fc-end\" ` +
		`style=\"inset: ${top}px 0 -${bottom}px; z-index: 1;\">` +
		`<div class=\"fc-content\">` +
		`<div class=\"fc-time\" data-start=\"${start[0]}:${start[0]}\" ` +
		`data-full=\"${startFullTime} - ${endFullTime}\">` +
		`<span>${slot.startTime} - ${slot.endTime}</span>` +
		`</div>` +
		`<div class=\"fc-title\">Available</div>` +
		`</div><div class="fc-bg"></div>` +
		`</a>`

	console.log("[42 Slot Watcher] placing slot:", element);
	eventContainer.insertAdjacentHTML("beforeend", element);
}
