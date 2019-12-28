import { createMachine, assign } from "@xstate/fsm";
import { actions } from "./actions";
export const validity = {
	valid: "valid",
	invalid: "invalid"
};
export const createInputMachine = focusedInput => {
	const { formStateService } = focusedInput;
	return createMachine({
		id: `inputStateMachine${focusedInput.inputIndex}`,
		initial: "idle",
		context: {
			currentInput: focusedInput,
			customValidationFn: focusedInput.customValidationFn || null,
			currentValidity: "valid",
			formStateService,
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
					assign({
						inputStateService: (_, event) =>
							event.currentInput.inputStateService
					})
				],
				on: {
					INPUT: {
						target: "validating",
						actions: (_, event) => (event.source = "focused")
					},
					BLUR: "blurred"
				}
			},
			validating: {
				entry: [
					assign({
						currentValidity: ctx => {
							if (actions.validateInput(ctx)) {
								return "valid";
							}
							return "invalid";
						}
					}),
					{
						type: "jumpToValidityState",
						exec: (ctx, event) =>
							ctx.currentValidity === "valid"
								? ctx.inputStateService.send({
										type: "VALID",
										source: event.source
								  })
								: ctx.inputStateService.send({
										type: "INVALID",
										source: event.source
								  })
					},
					console.trace
				],
				on: {
					INPUT: {
						target: "",
						cond: () => false,
						actions: console.trace
					},
					VALID: "valid",
					INVALID: "invalid"
				}
			},
			invalid: {
				entry: [console.log],
				on: {
					INPUT: {
						target: "validating",
						actions: (_, event) => (event.source = "invalid")
					},
					BLUR: "InvalidBlurred",
					FOCUS: "focused"
				}
			},
			valid: {
				entry: [console.log],
				on: {
					INPUT: {
						target: "validating",
						actions: (_, event) => (event.source = "valid")
					},
					FOCUS: "focus"
				}
			},
			blurred: {
				entry: assign({
					blurred: ctx => {
						if (ctx.currentValidationDelay)
							ctx.currentValidationDelay.exec();
						else actions.validateInput(ctx);

						return true;
					}
				}),
				on: {
					FOCUS: "focused"
				}
			},
			InvalidBlurred: {
				on: {
					FOCUS: "focused",
					INPUT: "validating"
				}
			}
		}
	});
};
