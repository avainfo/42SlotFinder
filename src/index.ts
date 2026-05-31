import {
	setupCalendarSelection,
	startRecording,
	stopRecording,
	getCurrentPattern,
} from "./events/mouse-events";

import {fetchSlots, timeToString} from "./utils/slots-management";

function createDebugPanel(): void {
	if (document.querySelector("#slot-watcher-panel")) {
		return;
	}

	const panel = document.createElement("div");

	panel.id = "slot-watcher-panel";
	panel.innerHTML = `
		<strong>42 Slot Watcher</strong>
		<button id="slot-start-recording">Start recording</button>
		<button id="slot-stop-recording">Stop recording</button>
		<button id="slot-fetch-slots">Fetch slots</button>
		<div id="slot-current-pattern">No pattern selected</div>
	`;

	document.body.appendChild(panel);

	document
		.querySelector<HTMLButtonElement>("#slot-start-recording")
		?.addEventListener("click", () => {
			startRecording();
			updatePatternText();
		});

	document
		.querySelector<HTMLButtonElement>("#slot-stop-recording")
		?.addEventListener("click", () => {
			stopRecording();
			updatePatternText();
		});

	document
		.querySelector<HTMLButtonElement>("#slot-fetch-slots")
		?.addEventListener("click", async () => {
			try {
				const slots = await fetchSlots();
				console.log("[42 Slot Watcher] slots:", slots);
			} catch (error) {
				console.error("[42 Slot Watcher] fetch failed:", error);
			}
		});
}

function updatePatternText(): void {
	const pattern = getCurrentPattern();
	const element = document.querySelector<HTMLElement>("#slot-current-pattern");

	if (!element) {
		return;
	}

	if (!pattern) {
		element.textContent = "No pattern selected";
		return;
	}

	element.textContent = `Pattern: ${pattern.startTime} → ${pattern.endTime}`;
}

function main(): void {
	console.log("[42 Slot Watcher] loaded");

	// fetchSlots().then(value => console.log(value));
	setupCalendarSelection();
	createDebugPanel();
	for (let i = 0; i < 24; i++) {
		console.log(timeToString(`${i}:10`))
	}
}

declare const browser: {
	runtime: {
		onMessage: {
			addListener: (
				callback: (message: { type?: string }) => void,
			) => void;
		};
	};
};

browser.runtime.onMessage.addListener((message) => {
	if (message.type === "START_RECORDING") {
		startRecording();
	}

	if (message.type === "STOP_RECORDING") {
		stopRecording();
	}

	if (message.type === "START_SEARCHING") {
		console.log("[42 Slot Watcher] start searching");
	}
});

main();
