import { LitElement, html } from "lit-element";

class Tofes extends LitElement {
  static get properties() {
    return {
      state: { type: Object },
      showSubmit: { type: Boolean, reflect: true },
      confirmText: { type: String, reflect: true },
      name: { type: String, reflect: true, attribute: true },
      form: { type: Object }
    };
  }

  constructor() {
    super();
    this.state = {};
    this.showSubmit = true;
    this.confirmText = "Submit";
    this.name = this.getAttribute("name");
    this.form = {};
  }

  slotPopulated(e) {
    this.submitEvent = new Event("submit");
    this.form = this.shadowRoot.children[this.name];
    this.form.noValidate = false;
    let slots = [...this.shadowRoot.querySelectorAll("slot")];
    slots.map(slot => {
      let nodes = slot.assignedNodes();
      nodes.map(node => {
        this.state = {
          ...this.state,
          [node.name]: node
        };
        node.required = true;
        node.dataset.popoverTarget = "my-popover";
        node.addEventListener("input", e => this.formValueUpdated(e, this));
        this.form.prepend(node);
      });
    });
  }

  render() {
    const { showSubmit, confirmText, name, state } = this;
    return html`
      <form
        @submit=${this.handleSubmit}
        .showSubmit=${showSubmit}
        .confirmText="${confirmText}"
        .name=${name}
      >
        <slot name="input" @slotchange=${this.slotPopulated}></slot>
        ${showSubmit &&
          html`
            <button
              @click=${() => this.form.dispatchEvent(this.submitEvent)}
              type="submit"
            >
              ${confirmText}
            </button>
          `}
      </form>
    `;
  }

  formValueUpdated(e, objRoot) {
    const { name } = e.target;
    console.log(objRoot.state[name].value);
  }

  handleSubmit(e) {
    // if (!e.target.checkValidity()) {
    console.log(e.target);
    e.preventDefault();
    for (let input in this.state) {
      console.log(this.state[input].validity.valid);
    }

    // }
    // e.target.reportValidity();
  }
}

customElements.define("tohen-tofes", Tofes);
