export default function wfcmsRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function wfcmsRandomFloat(min, max) {
	return Math.random() * (max - min) + min;
}
