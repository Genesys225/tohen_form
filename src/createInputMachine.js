import { createMachine, assign } from "@xstate/fsm";
import { actions } from "./actions";
export const validity = {
	valid: "valid",
	invalid: "invalid"
};
export const createInputMachine = focusedInput => {
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
          assign({
            inputStateService: (_, event) => event.currentInput.inputStateService
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
            currentValidity: actions.validateInput
          }),
          {
            type: actions.changeToValidityState.name,
            exec: actions.changeToValidityState
          },
          console.trace
        ],
        on: {
          INPUT: "validating",
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
          FOCUS: "focused",
          BLUR: "valid"
        }
      },
      blurred: {
        entry: [
          assign({
            blurred: () => true
          }),
          {
            type: actions.changeToValidityState.name,
            exec: actions.changeToValidityState
          }
        ],
        on: {
          FOCUS: "focused",
          INVALID: "InvalidBlurred",
          VALID: "valid"
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
