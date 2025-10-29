import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCodeListComponent } from './qrcode-list.component';

describe('QRCodeListComponent', () => {
  let component: QRCodeListComponent;
  let fixture: ComponentFixture<QRCodeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRCodeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QRCodeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
