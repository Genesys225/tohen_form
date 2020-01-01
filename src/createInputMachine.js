import { createMachine, assign } from "@xstate/fsm";
import { actions } from "./actions";
export const validity = {
	valid: "valid",
	invalid: "invalid"
};

export const createInputMachine = focusedInput => {
	const transitions = {
		validating: source => ({
			target: "validating",
			actions: (_actions, event) => (event.source = source)
		})
	};
	const inputStateService = (_actions, event) =>
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
			currentValidationTimer: null,
			inputStateService: null
		},
		states: {
			idle: {
				on: {
					FOCUS: "focused"
				}
			},
			focused: {
				entry: [
					assign({ blurred: false }),
					assign({ inputStateService })
				],
				on: {
					INPUT: transitions.validating("focused"),
					BLUR: "blurred"
				}
			},
			validating: {
				entry: [
					assign({ currentValidity: actions.validateInput }),
					actions.changeToValidityState,
					console.trace
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
					assign({ blurred: true }),
					actions.changeToValidityState
				],
				on: {
					FOCUS: "focused",
					INVALID: "InvalidBlurred",
					VALID: "valid"
				}
			},
			InvalidBlurred: {
				entry: actions.execValidationEffects,
				on: {
					FOCUS: "focused",
					INPUT: transitions.validating("InvalidBlurred")
				}
			}
		}
	});
};
