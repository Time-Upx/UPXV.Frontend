import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumableListComponent } from './consumable-list.component';

describe('ConsumableListComponent', () => {
  let component: ConsumableListComponent;
  let fixture: ComponentFixture<ConsumableListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsumableListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsumableListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
