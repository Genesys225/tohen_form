import { LitElement, html } from "lit-element";
import { interpret } from "@xstate/fsm";
import { popOverCss } from "./tippyStyles";
import createFormMachine from "./createFormMachine";

/**
 * @class Tofes
 * @extends {LitElement}
 */
class Tofes extends LitElement {
	static get properties() {
		return {
			state: { type: Object },
			showSubmit: { type: Boolean, reflect: true },
			confirmText: { type: String, reflect: true },
			disableValidation: { type: Boolean },
			tippyValidationPop: { type: Boolean },
			validateBeforeSubmit: { type: Boolean },
			customValidationStyle: { type: Object },
			name: { type: String, reflect: true, attribute: true },
			form: { type: Object }
		};
	}

	setState(newState) {
		this.state = newState(this.state);
	}

	constructor() {
		super();
		this.state = {};
		this.disableValidation = false;
		this.tippyValidationPop = true;
		this.validateBeforeSubmit = false;
		this.submitFailedValidation = false;
		this.invalidationDelay = 2500;
		this.showSubmit = true;
		this.confirmText = "Submit";
		this.form;
		this.inputSubscribed = false;
		this.inputsInitialized = false;
		this.name = this.getAttribute("name");
		const formStateMachine = createFormMachine(this);
		this.formStateService = interpret(formStateMachine).start();
		this.formStateService.subscribe(console.trace);
	}

	slotPopulated(e) {
		/** @type {HTMLFormElement} */
		this.form = this.shadowRoot.children[this.name];
		if (e.target.assignedNodes().length > 0)
			this.formStateService.send({
				type: "SLOTTED",
				tofes: this
			});
		else
			this.formStateService.send({
				type: "INPUTS_OBTAINED",
				tofes: this
			});
	}

	render() {
		const { showSubmit, confirmText, name } = this;
		return html`
			${popOverCss}
			<form
				@submit=${this.handleSubmit}
				.showSubmit=${showSubmit}
				.confirmText="${confirmText}"
				.name=${name}
			>
				<slot name="input" @slotchange=${this.slotPopulated}></slot>
				${showSubmit &&
					html`
						<button type="submit">
							${confirmText}
						</button>
					`}
			</form>
		`;
	}

	handleFocus(e) {
		const currentInput = e.target;
		const { inputStateService } = currentInput;
		this.formStateService.send({
			type: "FOCUS",
			currentInput,
			tofes: this
		});
		inputStateService.send({
			type: "FOCUS",
			currentInput
		});
		if (!currentInput.inputSubscribedTo) {
			currentInput.inputSubscribedTo = true;
			inputStateService.subscribe(state => {
				console.trace(state.context.currentInput.name, state);
			});
		}
	}

	handleBlur(e) {
		const { inputStateService } = e.target;
		inputStateService.send({
			type: "BLUR",
			currentInput: e.target.name
		});
	}

	handleInput(e) {
		const { inputStateService } = e.target;
		inputStateService.send({
			type: "INPUT",
			currentInput: e.target.name
		});
	}

	/** @param {Event} e */
	handleSubmit(e) {
		e.stopImmediatePropagation();
		e.preventDefault();
		console.trace(e);
	}
}

customElements.define("tohen-tofes", Tofes);
