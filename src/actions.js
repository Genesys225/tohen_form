import { createInputMachine } from "./createInputMachine";
import { interpret } from "@xstate/fsm";
import tippy, { hideAll } from "tippy.js";

function changeToValidityState(event, ctx) {
	const { send } = ctx.inputStateService;
	const { source, validityReport } = event;
	if (ctx.currentValidity === "valid")
		send({
			type: "VALID",
			source
		});
	else
		send({
			type: "INVALID",
			source,
			validityReport
		});
}
function injectContext(conf) {
	return {
		// Optional (if the plugin provides a prop to use)
		name: "context", // e.g. 'followCursor' or 'sticky'
		defaultValue: conf,

		// Required
		fn() {
			// Internal state
			return {};
		}
	};
}

/** @typedef {HTMLInputElement} reference */
function onShow(instance) {
	const { reference, setProps, setContent } = instance;
	const { displayMulti } = instance.props.context;
	const { dataset } = reference;
	const { validationMessage, arrow } = dataset;
	!displayMulti && hideAll();
	arrow &&
		setProps({
			arrow
		});
	setContent(validationMessage);
	if (reference.validity.valid) return false;
}

function onHide(instance) {
	const { displayMulti } = instance.props.context;
	if (displayMulti && instance.reference.classList.contains("invalid"))
		return false;
}

function tippyConfig(conf) {
	const tippyConfObj = {
		onCreate: console.log,
		onShow,
		onHide,
		trigger: "manual",
		plugins: [injectContext(conf)]
	};
	return tippyConfObj;
}

function initializeForm(input, i) {
	const {
		form,
		handleFocus,
		handleInput,
		handleBlur,
		formStateService,
		invalidationDelay,
		displayMulti
	} = this;

	const tippyGlobalConf = { displayMulti };
	this.setState(state => ({
		...state,
		[input.name]: input
	}));
	Object.assign(input, {
		formStateService,
		required: true,
		inputIndex: i,
		invalidationDelay
	});
	// @ts-ignore
	tippy(input, tippyConfig(tippyGlobalConf));
	input.addEventListener("input", handleInput.bind(this));
	input.addEventListener("focus", handleFocus.bind(this));
	input.addEventListener("blur", handleBlur.bind(this));
	form.prepend(input);
}

export const actions = {
	initializeForm: {
		type: "initializeForm",
		exec(context, event) {
			const { tofes } = event;
			const { shadowRoot, formStateService } = tofes;
			context.formStateService = formStateService;
			const slots = [...shadowRoot.querySelectorAll("slot")];
			slots.forEach(slot => {
				const nodes = slot.assignedNodes();
				/**@type {Array<HTMLInputElement>} */
				const htmlInputs = nodes.filter(
					node => node.nodeName === "INPUT"
				);
				htmlInputs.forEach(initializeForm, tofes);
			});
		}
	},

	initializeInputs: {
		type: "initializeInputs",
		exec(_context, event) {
			const { tofes } = event;
			tofes.form.noValidate = true;
			tofes.setState(state => {
				const inputNames = Object.keys(state);
				function setState(inputName) {
					const inputStateMachine = createInputMachine(
						state[inputName],
						tofes.displayMulti
					);
					state[inputName].inputStateService = interpret(
						inputStateMachine
					).start();
					state[inputName].initialized = true;
				}
				inputNames.forEach(setState);
				return state;
			});
		}
	},

	announceInitSuccess: {
		type: "announceInitSuccess",
		exec(ctx) {
			console.log(
				ctx.inputsInitialized &&
					"SUCCESSFULLY INITIALIZED INPUT MACHINES"
			);
		}
	},

	updateFormValidity: {
		type: "updateFormValidity",
		exec: (ctx, event) => {
			if (
				ctx.currentValidity === "valid" &&
				event.currentValidity === "invalid"
			)
				ctx.currentValidity = event.currentValidity;
		}
	},

	validateInput(context, event) {
		const { customValidationFn, currentInput } = context;
		const isNativeValid = currentInput.checkValidity();
		const customValidity =
			customValidationFn && customValidationFn(currentInput);
		const isCustomValid =
			customValidity === null || !customValidity || customValidity.error;
		const { validity } = currentInput;
		if (isCustomValid && isNativeValid) return "valid";
		const source = isNativeValid ? "customValidation" : "nativeValidation";
		event.validityReport = {
			source,
			validity,
			customValidity
		};

		return "invalid";
	},

	reportValidityChange: {
		type: "reportValidityChange",
		exec({ formStateService, currentInput }, event) {
			formStateService.send({ ...event, currentInput });
		}
	},

	execValidationEffects: {
		type: "execValidationEffects",
		exec(context, event) {
			const { currentInput } = context;
			const { _tippy } = currentInput;
			console.trace(event.type);
			switch (event.type) {
				case "VALID":
					console.trace(_tippy);
					currentInput.classList.add("valid");
					currentInput.classList.remove("invalid");
					_tippy.hide();
					break;
				case "INVALID":
					currentInput.classList.remove("valid");
					currentInput.classList.add("invalid");
					_tippy.show();
					break;

				default:
					_tippy.show();
					console.trace(_tippy);
					break;
			}
		}
	},

	changeToValidityState: {
		type: "changeToValidityState",
		exec(ctx, event) {
			const { type } = event;
			console.log(event);
			const isBlurred = type === "BLUR";
			const isValid = ctx.currentValidity === "valid";
			const delay = isValid || isBlurred ? 0 : ctx.invalidationDelay;
			setTimeout(changeToValidityState, delay, event, ctx);
		}
	}
};
