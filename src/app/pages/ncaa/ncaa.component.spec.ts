import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NCAAComponent } from './ncaa.component';

describe('NCAAComponent', () => {
  let component: NCAAComponent;
  let fixture: ComponentFixture<NCAAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NCAAComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NCAAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
