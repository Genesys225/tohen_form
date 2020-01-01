import { createInputMachine } from "./createInputMachine";
import { interpret } from "@xstate/fsm";
import tippy, { hideAll } from "tippy.js";

export const actions = {
	initializeForm(context, event) {
		const { tofes } = event;
		const {
			shadowRoot,
			form,
			handleFocus,
			handleInput,
			handleBlur,
			formStateService,
			invalidationDelay
		} = tofes;
		context.formStateService = formStateService;
		const slots = [...shadowRoot.querySelectorAll("slot")];
		slots.forEach(slot => {
			const nodes = slot.assignedNodes();
			/**@type {Array<HTMLInputElement>} */
			const htmlInputs = nodes.filter(node => node.nodeName === "INPUT");
			htmlInputs.forEach((input, i) => {
				tofes.state = {
					...tofes.state,
					[input.name]: input
				};
				Object.assign(input, {
					formStateService,
					required: true,
					inputIndex: i,
					invalidationDelay
				});
				// @ts-ignore
				tippy(input, {
					onCreate: console.log,
					onShow(instance) {
						hideAll();
						/** @type {HTMLInputElement} reference */
						// @ts-ignore
						const { reference, setProps, setContent } = instance;
						const { dataset } = reference;
						const { validationMessage, arrow } = dataset;
						arrow &&
							setProps({
								arrow
							});
						setContent(validationMessage);
						return !reference.validity.valid;
					},
					trigger: "manual"
				});
				input.addEventListener("input", handleInput.bind(tofes));
				input.addEventListener("focus", handleFocus.bind(tofes));
				input.addEventListener("blur", handleBlur.bind(tofes));
				form.prepend(input);
			});
		});
	},

	initializeInputs(_context, event) {
		const { tofes } = event;
		tofes.setState(state => {
			const inputNames = Object.keys(state);
			inputNames.forEach(inputName => {
				const inputStateMachine = createInputMachine(state[inputName]);
				state[inputName].inputStateService = interpret(
					inputStateMachine
				).start();
				state[inputName].initialized = true;
			});
			return state;
		});
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
		event.validityReport = {
			source: "nativeValidation",
			validity
		};
		if (isNativeValid)
			event.validityReport = {
				source: "customValidation",
				customValidity,
				validity
			};
		return "invalid";
	},

	reportValidityChange: {
		type: "reportValidityChange",
		exec: ({ formStateService, currentInput }, event) => {
			formStateService.send({ ...event, currentInput });
		}
	},

	execValidationEffects: {
		type: "execValidationEffects",
		exec: (context, event) => {
			const isValid = event.type === "VALID" ? true : false;
			console.log(event);
			const { currentInput } = context;
			const { _tippy } = currentInput;
			!isValid && _tippy.show();
		}
	},

	changeToValidityState(ctx, event) {
		const { source } = event;
		const isBlurred = source === "blurred" || source === "InvalidBlurred";
		const isValid = ctx.currentValidity === "valid";
		const { send } = ctx.inputStateService;
		const delay = isValid || isBlurred ? 0 : ctx.invalidationDelay;
		setTimeout(
			(event, ctx) => {
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
			},
			delay,
			event,
			ctx
		);
	}
};
