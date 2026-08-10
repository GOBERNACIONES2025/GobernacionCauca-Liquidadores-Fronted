import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Automotores } from './automotores';

describe('Automotores', () => {
  let component: Automotores;
  let fixture: ComponentFixture<Automotores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Automotores],
    }).compileComponents();

    fixture = TestBed.createComponent(Automotores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
