import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomGamesNcaaComponent } from './custom-games-ncaa.component';

describe('CustomGamesNcaaComponent', () => {
  let component: CustomGamesNcaaComponent;
  let fixture: ComponentFixture<CustomGamesNcaaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomGamesNcaaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomGamesNcaaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
