import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenPacksComponent } from './open-packs.component';

describe('OpenPacksComponent', () => {
  let component: OpenPacksComponent;
  let fixture: ComponentFixture<OpenPacksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpenPacksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenPacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
