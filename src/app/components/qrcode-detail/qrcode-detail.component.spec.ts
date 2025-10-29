import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRCodeDetailComponent } from './qrcode-detail.component';

describe('QRCodeDetailComponent', () => {
  let component: QRCodeDetailComponent;
  let fixture: ComponentFixture<QRCodeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRCodeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QRCodeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
