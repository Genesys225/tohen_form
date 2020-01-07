import { hideAll } from "tippy.js";
function injectContext(conf) {
	return {
		name: "context",
		defaultValue: conf,
		fn: () => ({})
	};
}

/** @typedef {HTMLInputElement} reference */
function onShow(instance) {
	const { reference, setProps, setContent } = instance;
	const { displayMulti } = instance.props.context;
	const { dataset } = reference;
	const { validationMessage, arrow } = dataset;
	!displayMulti && hideAll();
	arrow && setProps({	arrow	});
	setContent(validationMessage);
	if (reference.validity.valid) return false;
}

function onHide(instance) {
	const { displayMulti } = instance.props.context;
	if (displayMulti && instance.reference.classList.contains("invalid"))
		return false;
}

export function tippyConfig(conf) {
	const tippyConfObj = {
		onCreate: console.log,
		onShow,
		onHide,
		trigger: "manual",
		plugins: [injectContext(conf)]
	};
	return tippyConfObj;
}
