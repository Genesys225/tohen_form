import { createInputMachine } from "./createInputMachine";
import { interpret } from "@xstate/fsm";
import tippy from "tippy.js";
import { tippyConfig } from "./tippyConf";

export const actions = {
	initializeForm: {
		type: "initializeForm",
		exec(context, event) {
			const { tofes } = event;
			const { shadowRoot, formStateService, form } = tofes;
			context.formStateService = formStateService;
			const slot = shadowRoot.querySelector("slot");
			const nodes = slot.assignedNodes().reverse();
			/** prepend developer's markup, to the inner form element*/
			nodes.forEach(node => form.prepend(node));
			/**@type {Array<HTMLInputElement>} - obtain all input elements*/
			const htmlInputs = nodes.filter(filterFormMembers, tofes).reverse();
			createInputGroups(htmlInputs, shadowRoot);
			/** init the inputs */
			htmlInputs.forEach(initializeFormInput, tofes);
		}
	},

	initializeInputs: {
		type: "initializeInputs",
		exec(_context, event) {
			const { tofes } = event;
			/** prevent form auto validatio by submit */
			tofes.form.noValidate = true;
			tofes.displayMulti = false;
			/** init form state machine, and store a reference to it on all inputs */
			tofes.setState(initInputMachines);
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

function filterFormMembers(node) {
	switch (node.nodeName) {
		case "SELECT":
			node.addEventListener("click", this.handleInput.bind(this));
			return true;
		case "INPUT":
			return true;

		default:
			break;
	}
}

function createInputGroups(htmlInputs, shadowRoot) {
	htmlInputs.forEach(input => {
		const validName = input.name.replace(/\W/g, "");
		const group = shadowRoot.querySelectorAll(`[name="${input.name}"]`);
		group.length > 1 && (input[validName] = group);
	});
}

function initializeFormInput(input, inputIndex) {
	const {
		handleFocus,
		handleInput,
		handleBlur,
		formStateService,
		invalidationDelay,
		displayMulti
	} = this;
	const tippyGlobalConf = { displayMulti };
	this.setState(initInputState, input, inputIndex);

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

function initInputMachines(state) {
	const inputNames = Object.keys(state);
	inputNames.forEach(initMachine, state);
	function initMachine(inputName) {
		const state = this;
		const inputStateMachine = createInputMachine(state[inputName]);
		state[inputName].inputStateService = interpret(
			inputStateMachine
		).start();
		state[inputName].initialized = true;
	}
	return state;
}

const validationOverrides = {
	get(target, prop) {
		if (prop === "checkValidity" && target.type === "checkbox") {
			const groupValidMember = target.form.querySelector(
				`[name="${target.name}"]:checked`
			);
			const correctTarget =
				groupValidMember && !target.checked ? groupValidMember : target;
			return correctTarget[prop].bind(correctTarget);
		}
		if (typeof target[prop] === "function")
			return target[prop].bind(target);

		return target[prop];
	}
};

function initInputState(state, input, inputIndex) {
	switch (input.type) {
		case "radio":
			state[input.name + inputIndex] = input;
			break;
		case "checkbox":
			state[input.name + inputIndex] = new Proxy(
				input,
				validationOverrides
			);
			break;

		default:
			state[input.name] = input;
			break;
	}
	return state;
}
