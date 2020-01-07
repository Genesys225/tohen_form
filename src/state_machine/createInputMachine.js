import { createMachine, assign } from "@xstate/fsm";
import { actions } from "./inputActions";
export const validity = {
	valid: "valid",
	invalid: "invalid"
};

export const createInputMachine = (focusedInput, displayMulti) => {
	const transitions = {
		validating: source => ({
			target: "validating",
			actions: (_context, event) => (event.source = source)
		})
	};
	const inputStateService = (_context, event) =>
		event.currentInput.inputStateService;

	const { formStateService, invalidationDelay } = focusedInput;
	return createMachine({
		id: `inputStateMachine${focusedInput.inputIndex}`,
		initial: "idle",
		context: {
			currentInput: focusedInput,
			customValidationFn: focusedInput.customValidationFn || null,
			currentValidity: "invalid",
			formStateService,
			invalidationDelay,
			blurred: true,
			displayMulti,
			currentValidationTimer: null,
			inputStateService: null
		},
		states: {
			idle: {
				on: { FOCUS: "focused" }
			},
			focused: {
				entry: [assign({ blurred: false, inputStateService })],
				on: {
					INPUT: transitions.validating("focused"),
					BLUR: "blurred"
				}
			},
			validating: {
				entry: [
					assign({ currentValidity: actions.validateInput }),
					actions.changeToValidityState,
					console.log
				],
				on: {
					INPUT: "validating",
					VALID: "valid",
					INVALID: "invalid"
				}
			},
			invalid: {
				entry: [console.log, actions.execValidationEffects],
				on: {
					INPUT: transitions.validating("invalid"),
					FOCUS: "focused",
					BLUR: "InvalidBlurred"
				}
			},
			valid: {
				entry: [console.log, actions.execValidationEffects],
				on: {
					INPUT: transitions.validating("valid"),
					FOCUS: "focused",
					BLUR: "valid"
				}
			},
			blurred: {
				entry: [
					assign({
						currentValidity: actions.validateInput,
						blurred: true
					}),
					actions.changeToValidityState,
					console.log
				],
				on: {
					FOCUS: "focused",
					INVALID: "InvalidBlurred",
					VALID: "valid"
				}
			},
			InvalidBlurred: {
				entry: [actions.execValidationEffects, console.log],
				on: {
					FOCUS: "focused",
					INPUT: transitions.validating("InvalidBlurred")
				}
			}
		}
	});
};
