import {SlotPattern} from "../utils/slot-types";

let isRecording = false;
let isDragging = false;
let dragStartY = 0;
let selectionBox: HTMLDivElement | null = null;
let currentPattern: SlotPattern | null = null;
let selectedDayRect: DOMRect | null = null;
let selectedDayDate: string | null = null;

export function startRecording(): void {
	isRecording = true;
	currentPattern = null;

	document.body.classList.add("slot-watcher-recording");

	console.log("[42 Slot Watcher] recording started");
}

export function stopRecording(): SlotPattern | null {
	isRecording = false;
	isDragging = false;

	document.body.classList.remove("slot-watcher-recording");

	if (selectionBox) {
		selectionBox.remove();
		selectionBox = null;
	}

	selectedDayRect = null;
	selectedDayDate = null;

	console.log("[42 Slot Watcher] recording stopped");
	console.log("[42 Slot Watcher] final pattern:", currentPattern);

	return currentPattern;
}

export function getCurrentPattern(): SlotPattern | null {
	return currentPattern;
}

export function setupCalendarSelection(): void {
	const timeGrid = document.querySelector<HTMLElement>(".fc-time-grid");

	if (!timeGrid) {
		console.warn("[42 Slot Watcher] .fc-time-grid not found");
		return;
	}

	timeGrid.addEventListener("mousedown", onSelectionStart as EventListener, true);
	document.addEventListener("mousemove", onSelectionMove as EventListener, true);
	document.addEventListener("mouseup", onSelectionEnd as EventListener, true);

	console.log("[42 Slot Watcher] calendar selection ready");
}

function onSelectionStart(event: MouseEvent): void {
	if (!isRecording) {
		return;
	}

	const timeGrid = document.querySelector<HTMLElement>(".fc-time-grid");

	if (!timeGrid || !timeGrid.contains(event.target as Node)) {
		return;
	}

	const dayCell = getDayCellFromX(event.clientX);

	if (!dayCell) {
		console.warn("[42 Slot Watcher] no day column found");
		return;
	}

	selectedDayDate = dayCell.dataset.date ?? null;

	event.preventDefault();
	event.stopPropagation();

	isDragging = true;
	dragStartY = event.clientY;

	selectedDayRect = dayCell.getBoundingClientRect();
	selectedDayDate = dayCell.dataset.date ?? null;

	selectionBox = document.createElement("div");
	selectionBox.className = "slot-watcher-selection-box";

	document.body.appendChild(selectionBox);

	updateSelectionBox(event.clientY);
}

function onSelectionMove(event: MouseEvent): void {
	if (!isRecording || !isDragging || !selectionBox) {
		return;
	}

	event.preventDefault();
	event.stopPropagation();

	updateSelectionBox(event.clientY);
}

function onSelectionEnd(event: MouseEvent): void {
	if (!isRecording || !isDragging) {
		return;
	}

	event.preventDefault();
	event.stopPropagation();

	isDragging = false;

	const pattern = buildPatternFromSelection(dragStartY, event.clientY);

	if (selectionBox) {
		selectionBox.remove();
		selectionBox = null;
	}

	if (!pattern) {
		console.warn("[42 Slot Watcher] invalid pattern selection");
		return;
	}

	currentPattern = pattern;

	console.log("[42 Slot Watcher] selected pattern:", currentPattern);
}

function updateSelectionBox(currentY: number): void {
	if (!selectionBox || !selectedDayRect) {
		return;
	}

	const top = Math.min(dragStartY, currentY);
	const bottom = Math.max(dragStartY, currentY);

	selectionBox.style.left = `${selectedDayRect.left}px`;
	selectionBox.style.top = `${top}px`;
	selectionBox.style.width = `${selectedDayRect.width}px`;
	selectionBox.style.height = `${bottom - top}px`;
}

function buildPatternFromSelection(
	startY: number,
	endY: number,
): SlotPattern | null {
	const topY = Math.min(startY, endY);
	const bottomY = Math.max(startY, endY);

	const startTime = getClosestTimeFromY(topY);
	const endTime = getClosestTimeFromY(bottomY);

	if (!startTime || !endTime || startTime === endTime) {
		return null;
	}

	return {
		date: selectedDayDate,
		startTime: startTime,
		endTime: endTime,
	};
}

function getClosestTimeFromY(clientY: number): string | null {
	const rows = document.querySelectorAll<HTMLTableRowElement>(
		".fc-slats tr[data-time]",
	);

	let closestTime: string | null = null;
	let closestDistance: number = Number.POSITIVE_INFINITY;

	for (const row of rows) {
		const rect: DOMRect = row.getBoundingClientRect();
		const distance: number = Math.abs(rect.top - clientY);
		const time: string | undefined = row.dataset.time;

		if (!time) {
			continue;
		}

		if (distance < closestDistance) {
			closestDistance = distance;
			closestTime = time;
		}
	}

	if (closestTime === null) {
		return null;
	}

	return closestTime.slice(0, 5);
}

function getDayCellFromX(clientX: number): HTMLElement | null {
	const dayCells = document.querySelectorAll<HTMLElement>(
		".fc-bg .fc-day[data-date]",
	);

	for (const dayCell of dayCells) {
		const rect = dayCell.getBoundingClientRect();

		if (clientX >= rect.left && clientX <= rect.right) {
			return dayCell;
		}
	}

	return null;
}
