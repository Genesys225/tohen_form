import { createMachine, assign } from "@xstate/fsm";
import { actions } from "./actions";

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
						actions: [
							{
								type: actions.initializeForm.name,
								exec: actions.initializeForm
							},
							console.trace
						]
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
					{
						exec: actions.initializeInputs,
						type: actions.initializeInputs.name
					},
					assign({ inputsInitialized: true }),
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
							ctx.inputsInitialized &&
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
