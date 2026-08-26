import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidacionesList } from './liquidaciones-list';

describe('LiquidacionesList', () => {
  let component: LiquidacionesList;
  let fixture: ComponentFixture<LiquidacionesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidacionesList],
    }).compileComponents();

    fixture = TestBed.createComponent(LiquidacionesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
