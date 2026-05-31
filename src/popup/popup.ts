function sendMessageToActiveTab(message: unknown): void {
	browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
		const tab = tabs[0];

		if (!tab?.id) {
			return;
		}

		browser.tabs.sendMessage(tab.id, message);
	});
}

document
	.querySelector("#start-recording-button")
	?.addEventListener("click", () => {
		sendMessageToActiveTab({ type: "START_RECORDING" });
	});

document
	.querySelector("#stop-recording-button")
	?.addEventListener("click", () => {
		sendMessageToActiveTab({ type: "STOP_RECORDING" });
	});

document
	.querySelector("#start-searching-button")
	?.addEventListener("click", () => {
		sendMessageToActiveTab({ type: "START_SEARCHING" });
	});
