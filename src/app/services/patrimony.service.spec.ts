import { TestBed } from '@angular/core/testing';

import { PatrimonyService } from './patrimony.service';

describe('PatrimonyService', () => {
  let service: PatrimonyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatrimonyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
