import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyPacksComponent } from './buy-packs.component';

describe('BuyPacksComponent', () => {
  let component: BuyPacksComponent;
  let fixture: ComponentFixture<BuyPacksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuyPacksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyPacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
