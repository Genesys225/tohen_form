
import { LitElement, html } from "lit-element";
// import { popFactory } from "./popOver";
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

    setState( newState ) {
        this.state = newState( this.state );
    }

    constructor () {
        super();
        this.state = {};
        this.disableValidation = false;
        this.tippyValidationPop = true;
        this.validateBeforeSubmit = false;
        this.submitFailedValidation = false;
        this.showSubmit = true;
        this.confirmText = "Submit";
        this.form;
        this.inputSubscribed = false;
        this.inputsInitiated = false;
        this.name = this.getAttribute("name");
        const formStateMachine = createFormMachine(this);
        this.formStateService = interpret(formStateMachine).start();
        this.formStateService.subscribe(console.trace);
    }

    slotPopulated() {
    /** @type {HTMLFormElement} */
        this.form = this.shadowRoot.children[this.name];
        this.formStateService.send({
            type: "SLOTTED",
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
        console.trace("FOCUS");

        this.formStateService.send({
            type: "FOCUS",
            currentInput: e.target,
            tofes: this
        });
        if (this.shadowRoot.activeElement === this.state[ e.target.name ]) {
            this.state[ e.target.name ].inputStateService.send({
                type: "FOCUS",
                currentInput: e.target
            });
        }
        if (!this.state[ e.target.name ].inputSubscribed) {
            this.state[ e.target.name ].inputSubscribed = true;
            this.state[ e.target.name ].inputStateService.subscribe(state => {
                // const { send } = this.formStateService;
                // const { value, context: { currentValidity } } = state;
                // const ctx = state.context;
                // switch (value) {
                // case "validating":
                //     // ctx.currentValidity === 'valid' ?
                //     //     ctx.currentInput.inputStateService.send({
                //     //         type: 'VALID',
                //     //         // source: event.source
                //     //     }) :
                //     //     ctx.currentInput.inputStateService.send({
                //     //         type: 'INVALID',
                //     //         // source: event.source
                //     //     });
                //     console.log(state);
                //     break;
                // case "invalid":
                // case "valid":
                //     // send({
                //     //     type: 'VALIDITY_CHANGED',
                //     //     currentValidity,
                //     // });
                //     break;
            
                // default:
                //     break;
                // }
                console.trace(state.context.currentInput.name, state);
            });
        } 
    }

    handleBlur(e) {
        const { name } = e.target;
        const { inputStateService } = this.state[name];
        inputStateService && inputStateService.send({
            type: "BLUR",
            currentInput: e.target.name,
        } );
    }

    handleInput(e) {
        const { name } = e.target;
        const { inputStateService } = this.state[name];
        inputStateService && inputStateService.send({
            type: "INPUT",
            currentInput: e.target.name,
        });
        // popFactory(e.target);
    }

    /** @param {Event} e */
    handleSubmit(e) {
        console.trace(e.target);
        e.stopImmediatePropagation();
        e.preventDefault();
    }

}

customElements.define( "tohen-tofes", Tofes );


