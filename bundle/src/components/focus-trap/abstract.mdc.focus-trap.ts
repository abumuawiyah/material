import { ElementRef } from '@angular/core';

/** @docs-private */
export interface FocusTrapHandle {
    readonly active: boolean;
    untrap();
}

/** @docs-private */
export abstract class AbstractMdcFocusInitial {
    /** @docs-private */ readonly priority: number;
    /** @docs-private */ readonly _elm: ElementRef;
}

/** @docs-private */
export abstract class AbstractMdcFocusTrap {
    constructor() {}

    abstract trapFocus(): FocusTrapHandle;
}
