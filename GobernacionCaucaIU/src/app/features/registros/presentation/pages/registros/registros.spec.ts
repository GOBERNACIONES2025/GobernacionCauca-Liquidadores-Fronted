import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Registros } from './registros';

describe('Registros', () => {
  let component: Registros;
  let fixture: ComponentFixture<Registros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registros],
    }).compileComponents();

    fixture = TestBed.createComponent(Registros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
