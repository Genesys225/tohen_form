/* eslint-disable no-fallthrough */
import { createInputMachine } from "./createInputMachine";
import { interpret } from "@xstate/fsm";
import tippy from "tippy.js";
import { tippyConfig } from "./tippyConf";

function filterFormMembers(node) {
  switch (node.nodeName) {
    case "SELECT":
      node.addEventListener("click", this.handleInput.bind(this));
    case "INPUT":
      return true;

    default:
      break;
  }
}

function initializeFormInput(input, inputIndex, htmlInputs) {
  const { handleFocus, handleInput, handleBlur, formStateService, invalidationDelay, displayMulti } = this;
  const tippyGlobalConf = { displayMulti };
	findDuplicates(htmlInputs);
  this.setState(
    (state, input, inputIndex) => {
			input.type === "radio" 
				? (state[input.name + inputIndex] = input) 
				: (state[input.name] = input);
      return state;
    },
    input,
    inputIndex
  );

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
}
export const actions = {
  initializeForm: {
    type: "initializeForm",
    exec(context, event) {
      const { tofes } = event;
      const { shadowRoot, formStateService, form } = tofes;
      context.formStateService = formStateService;
      const slot = shadowRoot.querySelectorAll("slot")[0];
      const nodes = slot.assignedNodes().reverse();
      /**@type {Array<HTMLInputElement>} - obtain all input elements*/
			const htmlInputs = nodes.filter(filterFormMembers, tofes).reverse();
			/** init the inputs */
			htmlInputs.forEach(initializeFormInput, tofes);
			/** prepend developer's to the inner form element*/
      nodes.forEach(node => form.prepend(node));
    }
  },
  initializeInputs: {
    type: "initializeInputs",
    exec(_context, event) {
			const { tofes } = event;
			/** prevent form auto validatio by submit */
      tofes.form.noValidate = true;
			/** init form state machine, and store a reference to it on all inputs */
      tofes.setState(state => {
        const inputNames = Object.keys(state);
        function setState(inputName) {
          const inputStateMachine = createInputMachine(state[inputName], tofes.displayMulti);
          state[inputName].inputStateService = interpret(inputStateMachine).start();
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
      console.log(ctx.inputsInitialized && "SUCCESSFULLY INITIALIZED INPUT MACHINES");
    }
  }
};

function findDuplicates(htmlInputs) {
	// create a sorted inputs names array
  const inputNames = htmlInputs.map(input => input.name).sort();
	// create a sorted duplicate names array
  const duplicates = inputNames.reduce((res, input, i) => {
		inputNames[i + 1] === input && !res[input] && (res[input] = input);
    return res;
	}, {});
	console.log(duplicates);
	// create a duplicate name, input groups object, with duplicate name inputs arrays
	// { groupName: [input, input], group2Name: [input, input, input]}
  return htmlInputs
		.filter(function(input) {
			return Object.values(this).includes(input.name);
		}, duplicates)
		/** assign the groups to each member of the group */
		.map((input, _i, duplicateInputs) => {
			input[input.name] = duplicateInputs;
			return input;
		});
}
