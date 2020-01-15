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
	this.setState(state => ({ ...state, [input.name]: input }));
	if (input.type === "radio") {
		this.setState((state, input) => {
			let inputName = input.name;
			if (state[inputName] !== input) {
				input[inputName] = [input];
				state[inputName] = input;
			} else {
				state[inputName][inputName].push(input);
			}
			// node.dataset = inputState[node.name][0];
			return state;
		}, input);
		return true;
	}
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
			/**@type {Array<HTMLInputElement>} */
			const htmlInputs = nodes.filter(filterFormMembers, tofes);
			const inputGroups = findDuplicates(htmlInputs);
			htmlInputs.forEach(initializeFormInput, tofes);
			nodes.forEach(node => form.prepend(node));
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

function findDuplicates(htmlInputs) {
	const inputNames = htmlInputs.map(input => input.name).sort();
	const duplicates = inputNames.reduce((res, input, i) => {
		if (inputNames[i + 1] === input) {
			res.push(input);
		}
		return res;
	}, []);
	return htmlInputs
		.filter(input => duplicates.includes(input.name))
		.reverse();
}
