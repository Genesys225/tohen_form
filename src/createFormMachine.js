import { actions } from "./actions";
import { createMachine, assign } from "@xstate/fsm";

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
			currentValidity: "valid",
			formStateService: null,
			inputsInitiated: false
		},
		states: {
			idle: {
				on: {
					SLOTTED: {
						target: "formInitialized",
						actions: [
							{
								type: actions.initiateForm.name,
								exec: actions.initiateForm
							}
						]
					}
				}
			},
			formInitialized: {
				on: {
					SLOTTED: "inputsInitialized"
				},
				exit: [
					assign({
						currentInput: (_context, event) =>
							event.tofes.state[event.currentInput]
					}),
					{
						exec: actions.initiateInputs,
						type: actions.initiateInputs.name
					},
					assign({
						inputsInitiated: true
					}),
					assign({
						formStateService: (_context, event) =>
							event.tofes.formStateService
					}),
					console.trace
				]
			},
			inputsInitialized: {
				entry: [
					ctx =>
						console.log(
							ctx.inputsInitiated &&
								"SUCCESSFULLY INITIALIZED INPUT MACHINES"
						)
				],
				on: {
					FOCUS: "inputFocused"
				}
			},
			inputFocused: {
				entry: [
					assign({
						focused: true
					}),
					assign({
						currentInput: (context, event) =>
							event.currentInput
								? event.currentInput
								: context.currentInput
					})
				],
				on: {
					FOCUS: { target: "inputFocused" },
					VALIDITY_CHANGED: {
						target: "inputFocused",
						actions: {
							type: "updateFormValidity",
							exec: (ctx, event) => {
								if (
									ctx.currentValidity === "valid" &&
									event.currentValidity === "invalid"
								)
									ctx.currentValidity = event.currentValidity;
							}
						}
					}
				}
			}
		}
	});
}
