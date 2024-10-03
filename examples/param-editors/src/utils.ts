export const valuePrec = (step: number) => {
	const str = step.toString();
	const i = str.indexOf(".");
	return i > 0 ? str.length - i - 1 : 0;
};

export const formatValuePrec = (step: number) => {
	const prec = valuePrec(step);
	return (x: number) => x.toFixed(prec);
};
