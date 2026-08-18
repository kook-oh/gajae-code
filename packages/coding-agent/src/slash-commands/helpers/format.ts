import { shimmerText } from "../../modes/theme/shimmer";
import { theme as currentTheme, type Theme } from "../../modes/theme/theme";

/** Format a millisecond duration as a coarse-grained human label. */
export function formatDuration(ms: number): string {
	const seconds = Math.max(0, Math.round(ms / 1000));
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.round(minutes / 60);
	if (hours < 48) return `${hours}h`;
	const days = Math.round(hours / 24);
	return `${days}d`;
}

/**
 * Two-unit countdown for quota windows. {@link formatDuration} collapses
 * everything past 48h to a single rounded unit, so a weekly window reads `7d`
 * whether 6.6 or 7.4 days remain — useless when the question is "how long until
 * I get my quota back". Separate from `formatDuration` so job and elapsed
 * rendering keep the coarse label.
 */
export function formatResetCountdown(ms: number): string {
	const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
	if (totalMinutes < 1) return "<1m";
	if (totalMinutes < 60) return `${totalMinutes}m`;
	const totalHours = Math.floor(totalMinutes / 60);
	if (totalHours < 48) {
		const minutes = totalMinutes % 60;
		return minutes > 0 ? `${totalHours}h ${minutes}m` : `${totalHours}h`;
	}
	const days = Math.floor(totalHours / 24);
	const hours = totalHours % 24;
	return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

/** Absolute local reset time, so a long countdown maps onto a real calendar day. */
export function formatResetAt(resetsAt: number, nowMs: number): string {
	const withinADay = resetsAt - nowMs < 24 * 3_600_000;
	return new Date(resetsAt).toLocaleString(undefined, {
		month: withinADay ? undefined : "short",
		day: withinADay ? undefined : "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

type ProgressBarTheme = Pick<Theme, "bold" | "fg" | "getFgAnsi">;

const unstyledProgressBarTheme: ProgressBarTheme = {
	fg(_color, text) {
		return text;
	},
	bold(text) {
		return text;
	},
	getFgAnsi() {
		return "";
	},
};

function resolveProgressBarTheme(uiTheme: ProgressBarTheme | undefined): ProgressBarTheme {
	return uiTheme ?? currentTheme ?? unstyledProgressBarTheme;
}

/**
 * Render an ASCII progress bar with a trailing percent label.
 * `fraction` is clamped to `[0, 1]`. `undefined` renders a dotted placeholder.
 */
export function renderAsciiBar(fraction: number | undefined, width = 24, uiTheme?: ProgressBarTheme): string {
	const progressBarTheme = resolveProgressBarTheme(uiTheme);
	if (fraction === undefined) return `[${shimmerText("·".repeat(width), progressBarTheme)}]`;
	const clamped = Math.min(Math.max(fraction, 0), 1);
	const filled = Math.round(clamped * width);
	const pct = Math.round(clamped * 100);
	const bar = `${"█".repeat(filled)}${"░".repeat(Math.max(0, width - filled))}`;
	return `[${shimmerText(bar, progressBarTheme)}] ${pct}%`;
}
