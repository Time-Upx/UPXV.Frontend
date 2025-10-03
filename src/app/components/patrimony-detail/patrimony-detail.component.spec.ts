import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatrimonyDetailComponent } from './patrimony-detail.component';

describe('PatrimonyDetailComponent', () => {
  let component: PatrimonyDetailComponent;
  let fixture: ComponentFixture<PatrimonyDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatrimonyDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatrimonyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
