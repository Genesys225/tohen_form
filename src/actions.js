import { createInputMachine } from "./createInputMachine";
import { interpret } from "@xstate/fsm";

export const actions = {
	initiateForm(context, { tofes }) {
		const {
			shadowRoot,
			form,
			handleFocus,
			handleInput,
			handleBlur,
			formStateService
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
					inputIndex: i
				});
				input.addEventListener("input", handleInput.bind(tofes));
				input.addEventListener("focus", handleFocus.bind(tofes));
				input.addEventListener("blur", handleBlur.bind(tofes));
				form.prepend(input);
			});
		});
	},

	initiateInputs(context, event) {
		const { tofes } = event;
		tofes.setState(state => {
			const inputNames = Object.keys(state);
			inputNames.forEach(inputName => {
				const inputStateMachine = createInputMachine(state[inputName]);
				state[inputName].inputStateService = interpret(
					inputStateMachine
				).start();
				state[inputName].initiated = true;
			});
			return state;
		});
	},

	validateInput(context) {
		const { customValidationFn, currentInput } = context;
		const isValid = currentInput.checkValidity();
		const isCustomValid =
			customValidationFn && customValidationFn(currentInput);
		if ((isCustomValid === null || isCustomValid) && isValid) {
			return true;
		}
		return false;
	},

	delay(context) {
		var promise = new Promise(function(resolve) {
			context.currentValidationTimer = setTimeout(resolve, 2500, context);
		});
		return promise;
	},

	reportValidityChange({ formStateService, currentInput }, event) {
		formStateService.send({ ...event, currentInput });
	}
};
