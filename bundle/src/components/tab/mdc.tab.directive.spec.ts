import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, ViewChild } from '@angular/core';
import { TAB_DIRECTIVES, MdcTabDirective } from './mdc.tab.directive';
import { TAB_INDICATOR_DIRECTIVES } from './mdc.tab.indicator.directive';
import { hasRipple } from '../../testutils/page.test';

const template = `
<button mdcTab [active]="active" (activate)="activate($event)">
  <span mdcTabContent>
    <span mdcTabIcon class="material-icons">favorite</span>
    <span mdcTabLabel>Favorites</span>
  </span>
  <span mdcTabIndicator>
    <span mdcTabIndicatorContent></span>
  </span>
</button>
`;

const templateIndicatorSpanning = `
<button mdcTab [active]="active" (activate)="activate($event)">
  <span mdcTabContent>
    <span mdcTabIcon class="material-icons">favorite</span>
    <span mdcTabLabel>Favorites</span>
    <span mdcTabIndicator>
      <span mdcTabIndicatorContent></span>
    </span>
  </span>
</button>
`;

describe('MdcTabDirective', () => {
    abstract class AbstractTestComponent {
        events: any[] = [];
        active: boolean = null;
        activate(event: any) {
            this.events.push(event);
        }
    }

    @Component({
        template: template
    })
    class TestComponent extends AbstractTestComponent {
    }

    @Component({
        template: templateIndicatorSpanning
    })
    class SpanningTestComponent extends AbstractTestComponent {
    }

    function setup(testComponentType: any = TestComponent) {
        const fixture = TestBed.configureTestingModule({
            declarations: [...TAB_INDICATOR_DIRECTIVES, ...TAB_DIRECTIVES, testComponentType]
        }).createComponent(testComponentType);
        fixture.detectChanges();
        return { fixture };
    }

    it('should initialize with defaults', fakeAsync(() => {
        const { fixture } = setup(TestComponent);
        const tab: HTMLElement = fixture.nativeElement.querySelector('.mdc-tab');
        expect(tab).toBeDefined();
        expect(tab.classList).not.toContain('mdc-tab--active');
        expect(tab.getAttribute('aria-selected')).toBe('false');
        expect(tab.getAttribute('tabindex')).toBe('-1');
        expect(fixture.nativeElement.querySelector('.mdc-tab__content')).toBeDefined();
        expect(fixture.nativeElement.querySelector('.mdc-tab__icon')).toBeDefined();
        expect(fixture.nativeElement.querySelector('.mdc-tab__text-label')).toBeDefined();
        expect(fixture.nativeElement.querySelector('.mdc-tab-indicator')).toBeDefined();
        expect(fixture.nativeElement.querySelector('.mdc-tab-indicator__content')).toBeDefined();
        expect(hasRipple(tab)).toBe(true, 'the ripple element should be attached');
    }));

    it('tab can be activated and deactivated', (() => {
        const { fixture } = setup(TestComponent);
        validateActivation(fixture, TestComponent);
    }));

    it('indicator spanning tab activation and deactivation', (() => {
        const { fixture } = setup(SpanningTestComponent);
        validateActivation(fixture, SpanningTestComponent);
    }));

    it('click triggers activationRequest', fakeAsync(() => {
        const { fixture } = setup(TestComponent);
        const tab: HTMLElement = fixture.nativeElement.querySelector('.mdc-tab');
        const mdcTab = fixture.debugElement.query(By.directive(MdcTabDirective)).injector.get(MdcTabDirective);
        const events = [];
        const subscription = mdcTab.activationRequest$.subscribe(activation => events.push(activation));
        try {
          expect(events).toEqual([false]);
          tab.click(); tick(); fixture.detectChanges();
          expect(events).toEqual([false, true]);  
        } finally {
          subscription.unsubscribe();
        }
    }));

    it('active property triggers activationRequest', fakeAsync(() => {
        const { fixture } = setup(TestComponent);
        const tab: HTMLElement = fixture.nativeElement.querySelector('.mdc-tab');
        const mdcTab = fixture.debugElement.query(By.directive(MdcTabDirective)).injector.get(MdcTabDirective);
        const testComponent = fixture.debugElement.injector.get(TestComponent);
        const events = [];
        const subscription = mdcTab.activationRequest$.subscribe(activation => events.push(activation));
        try {
            expect(events).toEqual([false]);

            testComponent.active = true; tick(); fixture.detectChanges();
            expect(events).toEqual([false, true]);

            testComponent.active = false; tick(); fixture.detectChanges();
            expect(events).toEqual([false, true, false]);

            testComponent.active = true; tick(); fixture.detectChanges();
            expect(events).toEqual([false, true, false, true]);

            testComponent.active = true; tick(); fixture.detectChanges();
            expect(events).toEqual([false, true, false, true]); // no value change => no new event
        } finally {
            subscription.unsubscribe();
        }
    }));

    function validateActivation(fixture: ComponentFixture<unknown>, testComponentType: any = TestComponent) {
        const tab: HTMLElement = fixture.nativeElement.querySelector('.mdc-tab');
        const mdcTab = fixture.debugElement.query(By.directive(MdcTabDirective)).injector.get(MdcTabDirective);
        const testComponent = fixture.debugElement.injector.get(testComponentType);
        expect(testComponent.events).toEqual([]);

        validateActive(tab, false);
        expect(testComponent.events).toEqual([]);
    
        mdcTab._activate(0); fixture.detectChanges();
        validateActive(tab);
        expect(testComponent.events).toEqual([{tab: mdcTab, tabIndex: 0}]);
        testComponent.events = [];
    
        // changing active property should not do anything (but send a message to the parent,
        // so that it can deactivate the right tab and activate this one):
        testComponent.active = false; fixture.detectChanges();
        validateActive(tab);
        expect(testComponent.events).toEqual([]);
    
        mdcTab._deactivate(); fixture.detectChanges();
        validateActive(tab, false);
        expect(testComponent.events).toEqual([]);

        testComponent.active = true; fixture.detectChanges();
        validateActive(tab, false); // as above: active property should not affect state by itself
        expect(testComponent.events).toEqual([]);
    }

    function validateActive(tab: HTMLElement, active = true, focusOnActivate = true) {
        const indicator: HTMLElement = tab.querySelector('.mdc-tab-indicator');
        if (active) {
            expect(tab.classList).toContain('mdc-tab--active');
            expect(indicator.classList).toContain('mdc-tab-indicator--active');
            expect(tab.getAttribute('aria-selected')).toBe('true');
            expect(tab.getAttribute('tabindex')).toBe('0');
            if (focusOnActivate)
                expect(document.activeElement).toBe(tab);
        } else {
            expect(tab.classList).not.toContain('mdc-tab--active');
            expect(indicator.classList).not.toContain('mdc-tab-indicator--active');
            expect(tab.getAttribute('aria-selected')).toBe('false');
            expect(tab.getAttribute('tabindex')).toBe('-1');
        }
    }
});
