import { Beliefset } from "@unitn-asa/pddl-client";

class DeliverooMap {

    #x = 0;
    #y = 0;
    #movement = 0;
    #decay = 0;
    #max_parcel = 0;

    constructor() {
        this.x = 0;
        this.y = 0;
        this.movement = 0;
        this.decay = 0;
        this.max_parcel = 0;
    }

    get x() {
    return this.#x;
  }
  set x(value) {
    if (typeof value !== 'number') {
      throw new TypeError('x must be a number');
    }
    this.#x = value;
  }

  // Getter e setter per y
  get y() {
    return this.#y;
  }
  set y(value) {
    if (typeof value !== 'number') {
      throw new TypeError('y must be a number');
    }
    this.#y = value;
  }

  // Getter e setter per movement
  get movement() {
    return this.#movement;
  }
  set movement(value) {
    if (typeof value !== 'number') {
      this.#movement = Number(value);
    }
    this.#movement = value;
  }

  // Getter e setter per decay
  get decay() {
    return this.#decay;
  }
  set decay(value) {
    if (typeof value !== 'number') {
      console.log("Assuming infinite decay")
      this.#decay = null;
    }
    this.#decay = value;
  }

  // Getter e setter per max_parcel
  get max_parcel() {
    return this.#max_parcel;
  }
  set max_parcel(value) {
    if (typeof value !== 'number') {
      throw new TypeError('max_parcel must be a number');
    }
    this.#max_parcel = value;
  }

}

export { DeliverooMap }