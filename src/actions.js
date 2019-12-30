import { createInputMachine } from "./createInputMachine";
import { interpret } from "@xstate/fsm";

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
    } = event.tofes;
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
		const isValid = currentInput.checkValidity();
		const isCustomValid =
			customValidationFn && customValidationFn(currentInput);
		const validationResult = (isCustomValid === null || (!isCustomValid || isCustomValid.error)) && isValid
		if (validationResult) {
      return "valid";
		}
		const validityReport = isValid
			? {
					source: "customValidation",
					isCustomValid
				}
			: {
					source: "nativeValidation",
					reason: currentInput.validity
				};
		event.invalidationTrigger = validityReport;
		return "invalid";
	},

	reportValidityChange({ formStateService, currentInput }, event) {
		formStateService.send({ ...event, currentInput });
	},

	changeToValidityState(ctx, event) {
		const { source } = event;
		const isBlurred = source === "blurred";
		const isValid = ctx.currentValidity === "valid";
		const { send } = ctx.inputStateService;
		const delay = isValid || isBlurred ? 0 : ctx.invalidationDelay;
		setTimeout(
			(event, ctx) => {
				const { source, invalidationTrigger } = event
				if (ctx.currentValidity === "valid")
					send({
						type: "VALID",
						source
					});
				else
					send({
						type: "INVALID",
						source,
						invalidationTrigger
					});
			},
			delay,
			event,
			ctx
		);
	}
};
