import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatrimonyListComponent } from './patrimony-list.component';

describe('PatrimonyListComponent', () => {
  let component: PatrimonyListComponent;
  let fixture: ComponentFixture<PatrimonyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatrimonyListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatrimonyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
