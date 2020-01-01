import tippy from "tippy.js";

export const popFactory = (target, options = {}) => {
	options.title === null ? "" : target.name ? target.name : target.toString();
	const body = options.body === null ? "" : "this is a required field";
	const popper = tippy(target, {
		...options,
		content: body
	});
	target.focus();
	return popper;
};
