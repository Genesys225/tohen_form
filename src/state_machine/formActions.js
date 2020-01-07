import { createInputMachine } from "./createInputMachine";
import { interpret } from "@xstate/fsm";
import tippy from "tippy.js";
import { tippyConfig } from "./tippyConf";

function filterFormMembers(node) {
	switch (node.nodeName) {
		case "SELECT":
			node.addEventListener("click", this.handleInput.bind(this));
		case "INPUT":
			return true

		default:
			break;
	}
};  

function initializeFormInput(input, inputIndex) {
  const {
    form,
    handleFocus,
    handleInput,
    handleBlur,
    formStateService,
    invalidationDelay,
    displayMulti
  } = this;

  const tippyGlobalConf = { displayMulti };
  this.setState(state => ({ ...state, [input.name]: input }));
  Object.assign(input, {
    formStateService,
    required: true,
    inputIndex,
    invalidationDelay
  });
  // @ts-ignore
  tippy(input, tippyConfig(tippyGlobalConf));
  input.addEventListener("input", handleInput.bind(this));
  input.addEventListener("focus", handleFocus.bind(this));
  input.addEventListener("blur", handleBlur.bind(this));
  form.prepend(input);
}
export const actions = {
	initializeForm: {
		type: "initializeForm",
		exec(context, event) {
			const { tofes } = event;
			const { shadowRoot, formStateService } = tofes;
			context.formStateService = formStateService;
			const slots = [...shadowRoot.querySelectorAll("slot")];
			slots.forEach(slot => {
				const nodes = slot.assignedNodes().reverse();
				/**@type {Array<HTMLInputElement>} */
				const htmlInputs = nodes.filter(filterFormMembers, tofes);
				htmlInputs.forEach(initializeFormInput, tofes);
			});
		}
	},
	initializeInputs: {
		type: "initializeInputs",
		exec(_context, event) {
			const { tofes } = event;
			tofes.form.noValidate = true;
			tofes.setState(state => {
				const inputNames = Object.keys(state);
				function setState(inputName) {
					const inputStateMachine = createInputMachine(
						state[inputName],
						tofes.displayMulti
					);
					state[inputName].inputStateService = interpret(
						inputStateMachine
					).start();
					state[inputName].initialized = true;
				}
				inputNames.forEach(setState);
				return state;
			});
		}
	},

	announceInitSuccess: {
		type: "announceInitSuccess",
		exec(ctx) {
			console.log(
				ctx.inputsInitialized &&
					"SUCCESSFULLY INITIALIZED INPUT MACHINES"
			);
		}
	}
};
