import { createMachine, assign } from "@xstate/fsm";
import { actions } from "./actions";

function currentInput(context, event) {
	return event.currentInput ? event.currentInput : context.currentInput;
}
export default function createFormMachine(tofes) {
	const {
		submitFailedValidation,
		disableValidation,
		tippyValidationPop,
		validateBeforeSubmit
	} = tofes;

	return createMachine({
		id: "formStateMachine",
		initial: "idle",
		context: {
			focused: false,
			currentInput: null,
			submitFailedValidation,
			disableValidation,
			tippyValidationPop,
			validateBeforeSubmit,
			currentValidity: "invalid",
			formStateService: null,
			inputsInitialized: false
		},
		states: {
			idle: {
				on: {
					SLOTTED: {
						target: "formInitialized",
						actions: [actions.initializeForm, console.trace]
					}
				}
			},
			formInitialized: {
				on: {
					INPUTS_OBTAINED: "inputsInitialized"
				},
				exit: [
					assign({
						currentInput: (_context, event) =>
							event.tofes.state[event.currentInput]
					}),
					actions.initializeInputs,
					assign({ inputsInitialized: true }),
					assign({
						formStateService: (_context, event) =>
							event.tofes.formStateService
					}),
					console.trace
				]
			},
			inputsInitialized: {
				entry: [actions.announceInitSuccess],
				on: {
					FOCUS: "inputFocused"
				}
			},
			inputFocused: {
				entry: [
					assign({
						focused: true
					}),
					assign({ currentInput })
				],
				on: {
					FOCUS: { target: "inputFocused" },
					VALIDITY_CHANGED: {
						target: "inputFocused",
						actions: actions.updateFormValidity
					}
				}
			}
		}
	});
}
